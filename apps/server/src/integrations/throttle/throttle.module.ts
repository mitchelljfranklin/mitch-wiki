import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentModule } from '../environment/environment.module';
import { parseRedisUrl } from '../../common/helpers';
import { AUTH_THROTTLER, AI_CHAT_THROTTLER } from './throttler-names';
import Redis from 'ioredis';

// Named constants for throttler configuration.
const AUTH_THROTTLE_TTL_MS = 60_000;
const AUTH_THROTTLE_LIMIT = 10;
const AI_CHAT_THROTTLE_TTL_MS = 60_000;
const AI_CHAT_THROTTLE_LIMIT = 25;

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [EnvironmentModule],
      useFactory: (environmentService: EnvironmentService) => {
        const throttlerConfig = {
          throttlers: [
            { name: AUTH_THROTTLER, ttl: AUTH_THROTTLE_TTL_MS, limit: AUTH_THROTTLE_LIMIT },
            { name: AI_CHAT_THROTTLER, ttl: AI_CHAT_THROTTLE_TTL_MS, limit: AI_CHAT_THROTTLE_LIMIT },
          ],
          errorMessage: 'Too many requests',
        };

        // When Redis is enabled, use Redis-backed storage so throttler state
        // is shared across multiple app instances. Otherwise fall back to
        // the built-in in-memory storage for single-instance deployments.
        if (environmentService.isRedisEnabled()) {
          const redisConfig = parseRedisUrl(environmentService.getRedisUrl());

          return {
            ...throttlerConfig,
            storage: new ThrottlerStorageRedisService(
              new Redis({
                host: redisConfig.host,
                port: redisConfig.port,
                password: redisConfig.password,
                db: redisConfig.db,
                family: redisConfig.family,
                keyPrefix: 'throttle:',
              }),
            ),
          };
        }

        return {
          ...throttlerConfig,
          storage: new ThrottlerStorageService(),
        };
      },
      inject: [EnvironmentService],
    }),
  ],
})
export class ThrottleModule {}
