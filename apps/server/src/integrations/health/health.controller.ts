import { Controller, Get, Optional } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PostgresHealthIndicator } from './postgres.health';
import { RedisHealthIndicator } from './redis.health';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private postgres: PostgresHealthIndicator,
    @Optional() private redis: RedisHealthIndicator,
  ) {}

  @SkipTransform()
  @Get()
  @HealthCheck()
  async check() {
    const healthChecks = [() => this.postgres.pingCheck('database')];

    // Only include the Redis health check when the indicator is available.
    // When REDIS_URL is not configured, the Redis provider is skipped.
    if (this.redis) {
      healthChecks.push(() => this.redis.pingCheck('redis'));
    }

    return this.health.check(healthChecks);
  }

  @Get('live')
  async checkLive() {
    return 'ok';
  }
}
