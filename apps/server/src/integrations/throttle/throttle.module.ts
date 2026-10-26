import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentModule } from '../environment/environment.module';
import { createRetryStrategy, parseRedisUrl } from '../../common/helpers';
import {
  AUTH_THROTTLER,
  AI_CHAT_THROTTLER,
  OAUTH_REGISTER_THROTTLER,
  OAUTH_TOKEN_THROTTLER,
  OAUTH_AUTHORIZE_THROTTLER,
  SIEM_TEST_THROTTLER,
  UNFURL_THROTTLER,
  CLOUD_EMAIL_THROTTLER,
} from './throttler-names';
import Redis from 'ioredis';

// Named constants for throttler configuration.
const AUTH_THROTTLE_TTL_MS = 60_000;
const AUTH_THROTTLE_LIMIT = 10;
const AI_CHAT_THROTTLE_TTL_MS = 60_000;
const AI_CHAT_THROTTLE_LIMIT = 25;
const OAUTH_REGISTER_THROTTLE_TTL_MS = 3_600_000; // 1 hour
const OAUTH_REGISTER_THROTTLE_LIMIT = 10;
const OAUTH_TOKEN_THROTTLE_TTL_MS = 60_000;
const OAUTH_TOKEN_THROTTLE_LIMIT = 60;
const OAUTH_AUTHORIZE_THROTTLE_TTL_MS = 60_000;
const OAUTH_AUTHORIZE_THROTTLE_LIMIT = 30;
const SIEM_TEST_THROTTLE_TTL_MS = 60_000;
const SIEM_TEST_THROTTLE_LIMIT = 10;
const UNFURL_THROTTLE_TTL_MS = 60_000;
const UNFURL_THROTTLE_LIMIT = 120;
const CLOUD_EMAIL_THROTTLE_TTL_MS = 60_000;
const CLOUD_EMAIL_THROTTLE_LIMIT = 5;

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [EnvironmentModule],
      useFactory: (environmentService: EnvironmentService) => {
        const throttlerConfig = {
          throttlers: [
            { name: AUTH_THROTTLER, ttl: AUTH_THROTTLE_TTL_MS, limit: AUTH_THROTTLE_LIMIT },
            { name: AI_CHAT_THROTTLER, ttl: AI_CHAT_THROTTLE_TTL_MS, limit: AI_CHAT_THROTTLE_LIMIT },
            { name: OAUTH_REGISTER_THROTTLER, ttl: OAUTH_REGISTER_THROTTLE_TTL_MS, limit: OAUTH_REGISTER_THROTTLE_LIMIT },
            { name: OAUTH_TOKEN_THROTTLER, ttl: OAUTH_TOKEN_THROTTLE_TTL_MS, limit: OAUTH_TOKEN_THROTTLE_LIMIT },
            { name: OAUTH_AUTHORIZE_THROTTLER, ttl: OAUTH_AUTHORIZE_THROTTLE_TTL_MS, limit: OAUTH_AUTHORIZE_THROTTLE_LIMIT },
            { name: SIEM_TEST_THROTTLER, ttl: SIEM_TEST_THROTTLE_TTL_MS, limit: SIEM_TEST_THROTTLE_LIMIT },
            { name: UNFURL_THROTTLER, ttl: UNFURL_THROTTLE_TTL_MS, limit: UNFURL_THROTTLE_LIMIT },
            { name: CLOUD_EMAIL_THROTTLER, ttl: CLOUD_EMAIL_THROTTLE_TTL_MS, limit: CLOUD_EMAIL_THROTTLE_LIMIT },
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
                username: redisConfig.username,
                password: redisConfig.password,
                db: redisConfig.db,
                family: redisConfig.family,
                tls: redisConfig.tls,
                retryStrategy: createRetryStrategy(),
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
