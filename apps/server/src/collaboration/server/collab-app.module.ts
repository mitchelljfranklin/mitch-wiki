import { Module } from '@nestjs/common';
import { AppController } from '../../app.controller';
import { AppService } from '../../app.service';
import { EnvironmentModule } from '../../integrations/environment/environment.module';
import { EnvironmentService } from '../../integrations/environment/environment.service';
import { CollaborationModule } from '../collaboration.module';
import { DatabaseModule } from '@docmost/db/database.module';
import { QueueModule } from '../../integrations/queue/queue.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from '../../integrations/health/health.module';
import { CollaborationController } from './collaboration.controller';
import { LoggerModule } from '../../common/logger/logger.module';
import { RedisModule } from '@nestjs-labs/nestjs-ioredis';
import { RedisConfigService } from '../../integrations/redis/redis-config.service';
import { CaslModule } from '../../core/casl/casl.module';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { defaultReconnectStrategy } from '@keyv/redis';
import { PERMISSION_CACHE_TTL_MS } from '../../common/helpers/cache-keys';
import { parseRedisUrl } from '../../common/helpers';

const collabRedisIsEnabled = !!process.env.REDIS_URL;

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    EnvironmentModule,
    CaslModule,
    CollaborationModule,
    // forRoot() supplies the BullMQ queue tokens (or the in-process mocks when
    // Redis is disabled); importing the bare module provides neither.
    QueueModule.forRoot(),
    HealthModule,
    EventEmitterModule.forRoot(),
    // Only connect to Redis when REDIS_URL is configured.
    // When disabled, the collaboration server uses in-memory fallbacks.
    ...(collabRedisIsEnabled
      ? [
          RedisModule.forRootAsync({
            useClass: RedisConfigService,
          }),
        ]
      : []),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (environmentService: EnvironmentService) => {
        // When Redis is enabled, use KeyvRedis as the cache store.
        // When disabled, fall back to an in-memory LRU cache for
        // single-instance collaboration deployments.
        if (environmentService.isRedisEnabled()) {
          const redisUrl = environmentService.getRedisUrl();
          const { family, tls } = parseRedisUrl(redisUrl);
          return {
            ttl: PERMISSION_CACHE_TTL_MS,
            stores: [
              new KeyvRedis({
                url: redisUrl,
                socket: {
                  family,
                  reconnectStrategy: defaultReconnectStrategy,
                  ...tls,
                },
              }),
            ],
          };
        }

        return {
          ttl: PERMISSION_CACHE_TTL_MS,
        };
      },
      inject: [EnvironmentService],
    }),
  ],
  controllers: [
    AppController,
    ...(process.env.COLLAB_SHOW_STATS?.toLowerCase() === 'true'
      ? [CollaborationController]
      : []),
  ],
  providers: [AppService],
})
export class CollabAppModule {}
