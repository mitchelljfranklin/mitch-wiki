import { DynamicModule, Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EnvironmentService } from '../environment/environment.service';
import { createRetryStrategy, parseRedisUrl } from '../../common/helpers';
import { QueueName } from './constants';
import { GeneralQueueProcessor } from './processors/general-queue.processor';
import { InProcessQueueService } from './in-process-queue.service';

// Default job options applied globally to every BullMQ queue when Redis is enabled.
// These mirror the original static configuration from the previous @Module decorator.
const REDIS_GLOBAL_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 20_000, // 20 seconds between retry attempts
  },
  removeOnComplete: {
    count: 200, // Keep the last 200 completed jobs for inspection
  },
  removeOnFail: {
    count: 100, // Keep the last 100 failed jobs for inspection
  },
};

// Per-queue default job options that override the global defaults for specific queues.
// These match the registerQueue configurations from the original module.
const PER_QUEUE_DEFAULT_JOB_OPTIONS: Record<string, Record<string, unknown>> = {
  [QueueName.FILE_TASK_QUEUE]: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 1,
  },
  [QueueName.SEARCH_QUEUE]: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 2,
  },
  [QueueName.AI_QUEUE]: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 1,
  },
  [QueueName.HISTORY_QUEUE]: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 2,
  },
  [QueueName.AUDIT_QUEUE]: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 3,
  },
  [QueueName.BASE_QUEUE]: {
    attempts: 2,
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
  [QueueName.INTEGRATION_QUEUE]: {
    removeOnComplete: true,
    removeOnFail: { count: 50 },
    attempts: 3,
  },
  [QueueName.SIEM_QUEUE]: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 1,
  },
};

// All queue names registered across the application. Must be kept in sync
// with any new queues added. Used both for BullMQ registration (Redis path)
// and for mock queue token providers (in-process path).
const ALL_QUEUE_NAMES = Object.values(QueueName);

/**
 * Checks whether Redis is configured by inspecting the REDIS_URL environment
 * variable at module initialization time. Called from forRoot() so that
 * ConfigModule has already loaded .env files before this runs.
 */
function isRedisConfigured(): boolean {
  const url = process.env.REDIS_URL;
  return Boolean(url && url.trim().length > 0);
}

@Global()
@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    const imports: DynamicModule['imports'] = [];
    const providers: DynamicModule['providers'] = [];
    const exports: DynamicModule['exports'] = [];

    if (isRedisConfigured()) {
      // Redis is available: register BullMQ with real Redis-backed queues
      imports.push(
        BullModule.forRootAsync({
          useFactory: (environmentService: EnvironmentService) => {
            const redisConfig = parseRedisUrl(
              environmentService.getRedisUrl(),
            );
            return {
              connection: {
                host: redisConfig.host,
                port: redisConfig.port,
                username: redisConfig.username,
                password: redisConfig.password,
                db: redisConfig.db,
                family: redisConfig.family,
                tls: redisConfig.tls,
                retryStrategy: createRetryStrategy(),
              },
              defaultJobOptions: REDIS_GLOBAL_DEFAULT_JOB_OPTIONS,
            };
          },
          inject: [EnvironmentService],
        }),
      );

      // Register each queue with its specific default job options (if any)
      for (const queueName of ALL_QUEUE_NAMES) {
        const specificOptions = PER_QUEUE_DEFAULT_JOB_OPTIONS[queueName];
        imports.push(
          BullModule.registerQueue({
            name: queueName,
            ...(specificOptions
              ? { defaultJobOptions: specificOptions }
              : {}),
          }),
        );
      }

      providers.push(GeneralQueueProcessor);
      exports.push(BullModule);
    } else {
      // Redis is NOT available: provide in-process queue fallback via EventEmitter2.
      // Mock queue tokens ensure @InjectQueue() decorators resolve without errors,
      // and job dispatch is handled by emitting events that @OnEvent listeners can handle.
      providers.push(InProcessQueueService);

      for (const queueName of ALL_QUEUE_NAMES) {
        // The token format matches @nestjs/bullmq's getQueueToken():
        //   `BullQueue_${name}`  or  `BullQueue_default` for unnamed queues.
        const BULL_QUEUE_TOKEN = `BullQueue_${queueName}`;

        providers.push({
          provide: BULL_QUEUE_TOKEN,
          useFactory: (inProcessService: InProcessQueueService) => ({
            add: (jobName: string, data: unknown) => {
              inProcessService.add(queueName, jobName, data);
              return Promise.resolve({
                id: `in-process-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              });
            },
          }),
          inject: [InProcessQueueService],
        });

        exports.push(BULL_QUEUE_TOKEN);
      }
    }

    return {
      module: QueueModule,
      imports,
      providers,
      exports,
    };
  }
}
