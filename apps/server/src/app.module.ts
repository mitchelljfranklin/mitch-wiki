import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { EnvironmentService } from './integrations/environment/environment.service';
import { AuditActorInterceptor } from './common/interceptors/audit-actor.interceptor';
import { CoreModule } from './core/core.module';
import { EnvironmentModule } from './integrations/environment/environment.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { WsModule } from './ws/ws.module';
import { DatabaseModule } from '@docmost/db/database.module';
import { StorageModule } from './integrations/storage/storage.module';
import { MailModule } from './integrations/mail/mail.module';
import { QueueModule } from './integrations/queue/queue.module';
import { StaticModule } from './integrations/static/static.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './integrations/health/health.module';
import { ExportModule } from './integrations/export/export.module';
import { ImportModule } from './integrations/import/import.module';
import { SecurityModule } from './integrations/security/security.module';
import { TelemetryModule } from './integrations/telemetry/telemetry.module';
import { RedisModule } from '@nestjs-labs/nestjs-ioredis';
import { RedisConfigService } from './integrations/redis/redis-config.service';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { LoggerModule } from './common/logger/logger.module';
import { ClsModule } from 'nestjs-cls';
import { ThrottleModule } from './integrations/throttle/throttle.module';
import { NoopAuditModule } from './integrations/audit/audit.module';
import { PERMISSION_CACHE_TTL_MS } from './common/helpers/cache-keys';

const redisIsEnabled = !!process.env.REDIS_URL;

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    LoggerModule,
    CoreModule,
    DatabaseModule,
    EnvironmentModule,
    // Only connect to Redis when REDIS_URL is configured.
    // When disabled, all subsystems fall back to in-memory alternatives.
    ...(redisIsEnabled
      ? [
          RedisModule.forRootAsync({
            useClass: RedisConfigService,
          }),
        ]
      : []),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (environmentService: EnvironmentService) => {
        // When Redis is enabled, use KeyvRedis as the cache store for
        // shared cache across multiple app instances.
        // When disabled, fall back to an in-memory LRU cache.
        if (environmentService.isRedisEnabled()) {
          const redisUrl = environmentService.getRedisUrl();
          return {
            ttl: PERMISSION_CACHE_TTL_MS,
            stores: [new KeyvRedis(redisUrl)],
          };
        }

        return {
          ttl: PERMISSION_CACHE_TTL_MS,
        };
      },
      inject: [EnvironmentService],
    }),
    CollaborationModule,
    WsModule,
    QueueModule.forRoot(),
    StaticModule,
    HealthModule,
    ImportModule,
    ExportModule,
    StorageModule.forRootAsync({
      imports: [EnvironmentModule],
    }),
    MailModule.forRootAsync({
      imports: [EnvironmentModule],
    }),
    EventEmitterModule.forRoot(),
    SecurityModule,
    TelemetryModule,
    ThrottleModule,
    NoopAuditModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditActorInterceptor,
    },
  ],
})
export class AppModule {}
