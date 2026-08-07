import { Injectable, Optional } from '@nestjs/common';
import { RedisService } from '@nestjs-labs/nestjs-ioredis';
import type { Redis } from 'ioredis';

const REDIS_KEY_PREFIX = 'history:contributors:';

@Injectable()
export class CollabHistoryService {
  private readonly redis: Redis | null = null;

  constructor(@Optional() private readonly redisService: RedisService) {
    if (this.redisService) {
      this.redis = this.redisService.getOrThrow();
    }
  }

  async addContributors(pageId: string, userIds: string[]): Promise<void> {
    if (!this.redis || userIds.length === 0) return;
    await this.redis.sadd(REDIS_KEY_PREFIX + pageId, ...userIds);
  }

  async popContributors(pageId: string): Promise<string[]> {
    if (!this.redis) return [];
    const members = await this.redis.smembers(REDIS_KEY_PREFIX + pageId);
    if (members.length > 0) {
      await this.redis.del(REDIS_KEY_PREFIX + pageId);
    }
    return members;
  }

  async clearContributors(pageId: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(REDIS_KEY_PREFIX + pageId);
  }
}
