import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;

  constructor(private configService: ConfigService) {}

  getClient(): Redis {
    if (!this.client) {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
        this.client.connect().catch(() => {
          // Redis is optional — log but don't crash
          console.warn('Redis connection failed — running without cache');
          this.client = null;
        });
      }
    }
    return this.client as Redis;
  }

  async isConnected(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) return false;
      const result = await client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (!client) return null;
    return client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    if (ttlSeconds) {
      await client.set(key, value, 'EX', ttlSeconds);
    } else {
      await client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    await client.del(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
