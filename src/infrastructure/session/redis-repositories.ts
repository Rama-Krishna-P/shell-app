import Redis from 'ioredis';
import { createHash } from 'node:crypto';
import { FAILED_LOGIN_MAX_ATTEMPTS, FAILED_LOGIN_WINDOW_SECONDS } from '../../application/security/login-rate-limit.policy';
import { RateLimitPort, SessionRepository, TransactionRepository } from '../../application/ports';

export function createRedisConnection(redisUrl: string): Redis {
    const localDevelopment = process.env['SHELL_ALLOW_INSECURE_LOCAL'] === 'true' && redisUrl.startsWith('redis://localhost');
    if (!redisUrl.startsWith('rediss://') && !localDevelopment) throw new Error('Redis TLS is required');
    return new Redis(redisUrl, { enableOfflineQueue: false, maxRetriesPerRequest: 1 });
}

class RedisJsonRepository<T> implements SessionRepository<T> {
    constructor(protected readonly redis: Redis) { }
    async get(reference: string): Promise<T | null> {
        try { const value = await this.redis.get(reference); return value === null ? null : JSON.parse(value) as T; } catch { return null; }
    }
    async set(reference: string, value: T, ttlSeconds: number): Promise<void> { await this.redis.set(reference, JSON.stringify(value), 'EX', ttlSeconds); }
    async delete(reference: string): Promise<void> { await this.redis.del(reference); }
}

export class RedisSessionRepository<T> extends RedisJsonRepository<T> { }

export class RedisTransactionRepository<T> extends RedisJsonRepository<T> implements TransactionRepository<T> {
    async consume(reference: string): Promise<T | null> {
        try {
            const value = await this.redis.getdel(reference);
            return value === null ? null : JSON.parse(value) as T;
        } catch { return null; }
    }
}

export class RedisLoginRateLimitAdapter implements RateLimitPort {
    constructor(private readonly redis: Redis) { }
    async allow(key: string): Promise<boolean> {
        const digest = createHash('sha256').update(key).digest('hex');
        const redisKey = `shell:login-rate:${digest}`;
        const count = await this.redis.incr(redisKey);
        if (count === 1) await this.redis.expire(redisKey, FAILED_LOGIN_WINDOW_SECONDS);
        return count <= FAILED_LOGIN_MAX_ATTEMPTS;
    }
}
