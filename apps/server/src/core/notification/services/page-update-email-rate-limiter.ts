import { Injectable, Optional, Logger } from '@nestjs/common';
import { RedisService } from '@nestjs-labs/nestjs-ioredis';
import type { Redis } from 'ioredis';

const KEY_PREFIX = 'page-update:emails:';
const DIGEST_PREFIX = 'page-update:digest:';
const TTL_SECONDS = 86400; // 24 hours
const MAX_IMMEDIATE_EMAILS = 4;

@Injectable()
export class PageUpdateEmailRateLimiter {
  private readonly redis: Redis | null = null;

  constructor(@Optional() private readonly redisService: RedisService) {
    if (this.redisService) {
      this.redis = this.redisService.getOrThrow();
    }
  }

  private hasRedis(): boolean {
    return this.redis !== null;
  }

  async canSendEmail(userId: string): Promise<boolean> {
    if (!this.hasRedis()) {
      return true;
    }
    const key = KEY_PREFIX + userId;
    const count = await this.redis.incr(key);
    await this.redis.expire(key, TTL_SECONDS, 'NX');
    return count <= MAX_IMMEDIATE_EMAILS;
  }

  async addToDigest(userId: string, notificationId: string): Promise<boolean> {
    if (!this.hasRedis()) {
      return true;
    }
    const key = DIGEST_PREFIX + userId;
    const len = await this.redis.rpush(key, notificationId);
    await this.redis.expire(key, TTL_SECONDS);
    return len === 1;
  }

  async popDigest(userId: string): Promise<string[]> {
    if (!this.hasRedis()) {
      return [];
    }
    const key = DIGEST_PREFIX + userId;
    const [ids] = await this.redis
      .multi()
      .lrange(key, 0, -1)
      .del(key)
      .exec();

    return (ids?.[1] as string[]) ?? [];
  }
}
