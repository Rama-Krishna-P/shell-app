import { failure, Result, success } from '../../domain/result';
import { RateLimitPort } from '../ports';

export const FAILED_LOGIN_MAX_ATTEMPTS = 5;
export const FAILED_LOGIN_WINDOW_SECONDS = 15 * 60;

export type LoginRateLimitError = 'rate-limited' | 'dependency-failure';

export class LoginRateLimitPolicy {
    constructor(private readonly limiter: RateLimitPort) { }

    async check(key: string): Promise<Result<void, LoginRateLimitError>> {
        if (!key.trim()) return failure('dependency-failure');
        try {
            return await this.limiter.allow(key) ? success(undefined) : failure('rate-limited');
        } catch {
            return failure('dependency-failure');
        }
    }
}