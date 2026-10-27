import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

// Both metadata keys are defined by @nestjs/bullmq, but the package root does
// not re-export them. They are read off the decorated class/method, exactly as
// BullExplorer does when it wires real workers.
const PROCESSOR_METADATA = 'bullmq:processor_metadata';
const ON_WORKER_EVENT_METADATA = 'bullmq:worker_events_metadata';

type WorkerEventHandler = (job: Job, result?: unknown) => unknown;

type InProcessProcessor = {
  instance: WorkerHost;
  handlers: Map<string, WorkerEventHandler>;
};

export type InProcessJobOptions = {
  delay?: number;
  jobId?: string;
};

type InProcessJob = {
  id: string;
  name: string;
  data: unknown;
  opts: InProcessJobOptions;
  attemptsMade: number;
  progress: number;
  failedReason?: string;
};

/**
 * In-process queue fallback used when Redis is not configured.
 *
 * BullMQ workers only exist with Redis, so without this dispatcher every job
 * added through a `@InjectQueue()` token would be accepted and silently
 * dropped (the classic symptom: an import stays "processing" forever with no
 * logs). Instead, each `add()` looks up the processor registered for that
 * queue and runs it on the event loop, then fires the processor's
 * `@OnWorkerEvent` handlers so completion/failure side effects still happen.
 *
 * Single instance only: jobs run in the web process and are lost on restart.
 * Delays are honoured with timers; repeatable/scheduled jobs are not supported
 * (see `upsertJobScheduler` in queue.module.ts).
 */
@Injectable()
export class InProcessQueueService {
  private readonly logger = new Logger(InProcessQueueService.name);
  private readonly metadataScanner = new MetadataScanner();
  private readonly pending = new Set<Promise<void>>();
  private processors: Map<string, InProcessProcessor> | null = null;
  private jobSequence = 0;

  constructor(private readonly discoveryService: DiscoveryService) {}

  add(
    queueName: string,
    jobName: string,
    data: unknown,
    opts: InProcessJobOptions = {},
  ): Promise<{ id: string }> {
    this.jobSequence += 1;
    const job: InProcessJob = {
      id: opts.jobId ?? `in-process-${Date.now()}-${this.jobSequence}`,
      name: jobName,
      data,
      opts,
      attemptsMade: 0,
      progress: 0,
    };

    const delay = typeof opts.delay === 'number' ? opts.delay : 0;
    if (delay > 0) {
      const timer = setTimeout(() => this.enqueue(queueName, job), delay);
      // A queued delay must not keep the process alive on shutdown.
      timer.unref?.();
    } else {
      this.enqueue(queueName, job);
    }

    return Promise.resolve({ id: job.id });
  }

  /** Waits for the jobs started so far. Used by tests and graceful shutdown. */
  async drain(): Promise<void> {
    while (this.pending.size > 0) {
      await Promise.allSettled([...this.pending]);
    }
  }

  private enqueue(queueName: string, job: InProcessJob): void {
    const task = this.run(queueName, job);
    this.pending.add(task);
    void task.finally(() => this.pending.delete(task));
  }

  private async run(queueName: string, job: InProcessJob): Promise<void> {
    const processor = this.getProcessors().get(queueName);
    if (!processor) {
      this.logger.warn(
        `No processor registered for queue ${queueName}; ${job.name} job was not run`,
      );
      return;
    }

    const asJob = job as unknown as Job;
    try {
      await processor.handlers.get('active')?.(asJob);
      const result = await processor.instance.process(asJob);
      await processor.handlers.get('completed')?.(asJob, result);
    } catch (error) {
      job.failedReason =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `In-process ${job.name} job failed. Reason: ${job.failedReason}`,
        error instanceof Error ? error.stack : undefined,
      );
      const failedHandler = processor.handlers.get('failed');
      if (failedHandler) {
        try {
          await failedHandler(asJob, error);
        } catch (handlerError) {
          this.logger.error(
            `Failed handler for ${job.name} job threw`,
            handlerError instanceof Error ? handlerError.stack : undefined,
          );
        }
      }
    }
  }

  private getProcessors(): Map<string, InProcessProcessor> {
    if (this.processors) return this.processors;

    const processors = new Map<string, InProcessProcessor>();
    for (const wrapper of this.discoveryService.getProviders()) {
      const instance = wrapper.instance as WorkerHost | undefined;
      if (!(instance instanceof WorkerHost)) continue;

      const metadata = Reflect.getMetadata(
        PROCESSOR_METADATA,
        instance.constructor,
      ) as { name?: string } | undefined;
      const queueName = metadata?.name;
      if (!queueName) continue;

      if (processors.has(queueName)) {
        this.logger.warn(
          `Multiple processors registered for queue ${queueName}; keeping the first one`,
        );
        continue;
      }
      processors.set(queueName, {
        instance,
        handlers: this.collectEventHandlers(instance),
      });
    }

    this.processors = processors;
    this.logger.debug(
      `In-process queue fallback handles ${processors.size} queue(s): ${[
        ...processors.keys(),
      ].join(', ')}`,
    );
    return processors;
  }

  private collectEventHandlers(
    instance: WorkerHost,
  ): Map<string, WorkerEventHandler> {
    const handlers = new Map<string, WorkerEventHandler>();
    const prototype = Object.getPrototypeOf(instance);
    for (const methodName of this.metadataScanner.getAllMethodNames(prototype)) {
      const method = (instance as unknown as Record<string, unknown>)[
        methodName
      ];
      if (typeof method !== 'function') continue;

      const metadata = Reflect.getMetadata(ON_WORKER_EVENT_METADATA, method) as
        | { eventName?: string }
        | undefined;
      if (!metadata?.eventName) continue;
      handlers.set(
        metadata.eventName,
        (method as WorkerEventHandler).bind(instance),
      );
    }
    return handlers;
  }
}
