import { describe, expect, it } from 'vitest';
import { LoginRateLimitPolicy, FAILED_LOGIN_MAX_ATTEMPTS, FAILED_LOGIN_WINDOW_SECONDS } from '../../../src/application/security/login-rate-limit.policy';
import { isSessionAuthorized, mapAuthenticationFailure } from '../../../src/application/auth/failure-policy';
import { RateLimitPort } from '../../../src/application/ports';

describe('US2 safe login failure policies', () => {
    it('keeps the failed-login threshold fixed at five attempts per fifteen minutes', () => {
        expect(FAILED_LOGIN_MAX_ATTEMPTS).toBe(5);
        expect(FAILED_LOGIN_WINDOW_SECONDS).toBe(900);
    });

    it('returns a generic rate-limit result and contains limiter failures', async () => {
        const limiter: RateLimitPort = { allow: async () => false };
        const rateLimitResult = await new LoginRateLimitPolicy(limiter).check('client-key');
        expect(rateLimitResult.ok ? null : rateLimitResult.error).toBe('rate-limited');
        expect(mapAuthenticationFailure('rate-limited').body.message).toBe('Unable to complete sign-in.');
        expect(await new LoginRateLimitPolicy({ allow: async () => { throw new Error('redis down'); } }).check('client-key')).toEqual({ ok: false, error: 'dependency-failure' });
        expect(await new LoginRateLimitPolicy(limiter).check('')).toEqual({ ok: false, error: 'dependency-failure' });
    });

    it('fails closed for missing, expired, inactive, and unreadable sessions', () => {
        expect(isSessionAuthorized(null)).toBe(false);
        expect(isSessionAuthorized({ subject: 's', username: { value: 'Ada' }, providerSessionReference: 'p', createdAt: 1, expiresAt: 1, active: true }, 1)).toBe(false);
        expect(isSessionAuthorized({ subject: 's', username: { value: 'Ada' }, providerSessionReference: 'p', createdAt: 1, expiresAt: 3, active: false } as unknown as Parameters<typeof isSessionAuthorized>[0], 2)).toBe(false);
    });
});