import { Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InProcessQueueService } from './in-process-queue.service';
import { QueueName } from './constants';

const TEST_QUEUE = QueueName.FILE_TASK_QUEUE;
const TEST_JOB = 'import-task';

@Processor(TEST_QUEUE)
class RecordingProcessor extends WorkerHost {
  readonly processed: Job[] = [];
  readonly completed: Job[] = [];
  readonly failed: Job[] = [];
  failWith: Error | null = null;

  async process(job: Job): Promise<void> {
    this.processed.push(job);
    if (this.failWith) throw this.failWith;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.completed.push(job);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job): void {
    this.failed.push(job);
  }
}

function createService(instances: unknown[]): InProcessQueueService {
  const discovery = {
    getProviders: () => instances.map((instance) => ({ instance })),
  } as unknown as DiscoveryService;
  return new InProcessQueueService(discovery);
}

describe('InProcessQueueService', () => {
  let processor: RecordingProcessor;

  beforeEach(() => {
    processor = new RecordingProcessor();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('runs the processor registered for the queue and fires completed', async () => {
    const service = createService([processor]);

    await service.add(TEST_QUEUE, TEST_JOB, { fileTaskId: 'task-1' });
    await service.drain();

    expect(processor.processed).toHaveLength(1);
    expect(processor.processed[0].name).toBe(TEST_JOB);
    expect(processor.processed[0].data).toEqual({ fileTaskId: 'task-1' });
    expect(processor.completed).toHaveLength(1);
    expect(processor.failed).toHaveLength(0);
  });

  it('fires the failed handler and keeps the failure reason', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    processor.failWith = new Error('import exploded');
    const service = createService([processor]);

    await service.add(TEST_QUEUE, TEST_JOB, { fileTaskId: 'task-2' });
    await service.drain();

    expect(processor.failed).toHaveLength(1);
    expect(processor.failed[0].failedReason).toBe('import exploded');
    expect(processor.completed).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('honours the delay before running the job', async () => {
    jest.useFakeTimers();
    const service = createService([processor]);

    await service.add(TEST_QUEUE, TEST_JOB, {}, { delay: 60_000 });
    expect(processor.processed).toHaveLength(0);

    jest.advanceTimersByTime(60_000);
    await service.drain();

    expect(processor.processed).toHaveLength(1);
  });

  it('warns instead of silently dropping a job with no processor', async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const service = createService([]);

    await service.add(TEST_QUEUE, TEST_JOB, {});
    await service.drain();

    expect(processor.processed).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No processor registered for queue'),
    );
  });

  it('ignores instances that are not BullMQ processors', async () => {
    const service = createService([processor, { notAProcessor: true }]);

    await service.add(TEST_QUEUE, TEST_JOB, {});
    await service.drain();

    expect(processor.processed).toHaveLength(1);
  });
});
