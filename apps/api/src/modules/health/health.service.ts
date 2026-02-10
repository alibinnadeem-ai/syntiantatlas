import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async check() {
    const uptime = process.uptime();

    // Check database
    let database = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      database = 'disconnected';
    }

    // Check Redis
    let redisStatus = 'disconnected';
    try {
      const connected = await this.redis.isConnected();
      redisStatus = connected ? 'connected' : 'disconnected';
    } catch {
      redisStatus = 'disconnected';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      services: {
        database,
        redis: redisStatus,
      },
    };
  }
}
