import { Global, Module, Provider } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { PostgresHealthIndicator } from './postgres.health';
import { RedisHealthIndicator } from './redis.health';

const healthIsRedisEnabled = !!process.env.REDIS_URL;

// Only register the Redis health indicator when Redis is configured.
// When disabled, the HealthController gracefully skips the Redis check
// via its @Optional() injection.
const healthProviders: Provider[] = [PostgresHealthIndicator];
if (healthIsRedisEnabled) {
  healthProviders.push(RedisHealthIndicator);
}

@Global()
@Module({
  controllers: [HealthController],
  providers: healthProviders,
  imports: [TerminusModule],
})
export class HealthModule {}
