import { describe, expect, it } from 'vitest';
import { LogoutUseCase } from '../../../src/application/auth/logout.use-case';
import { createRequireSessionMiddleware } from '../../../src/server/middleware/require-session';
import { SecureCookieAdapter } from '../../../src/infrastructure/security/security-adapters';

const session = { subject: 'subject-1', username: { value: 'Ada' }, providerSessionReference: 'provider-1', createdAt: 0, expiresAt: Date.now() + 60_000, active: true as const };

describe('US3 logout', () => {
    it('invalidates locally before attempting provider logout', async () => {
        const order: string[] = [];
        const result = await new LogoutUseCase({
            get: async () => session,
            set: async () => undefined,
            delete: async () => { order.push('local'); },
        }, {
            beginLogin: async () => { throw new Error('unused'); },
            completeLogin: async () => { throw new Error('unused'); },
            logout: async () => { order.push('provider'); throw new Error('provider unavailable'); },
        }).execute('session-1');
        expect(order).toEqual(['local', 'provider']);
        expect(result).toEqual({ localSessionInvalidated: true, providerLogoutFailed: true });
    });

    it('is idempotent for an already missing local session', async () => {
        let providerCalled = false;
        const result = await new LogoutUseCase({ get: async () => null, set: async () => undefined, delete: async () => undefined }, {
            beginLogin: async () => { throw new Error('unused'); },
            completeLogin: async () => { throw new Error('unused'); },
            logout: async () => { providerCalled = true; },
        }).execute('missing');
        expect(result).toEqual({ localSessionInvalidated: true, providerLogoutFailed: false });
        expect(providerCalled).toBe(false);
    });

    it('invalidates only the requested session', async () => {
        const sessions = new Map([['session-1', session], ['session-2', { ...session, subject: 'subject-2', providerSessionReference: 'provider-2' }]]);
        await new LogoutUseCase({
            get: async (reference) => sessions.get(reference) ?? null,
            set: async () => undefined,
            delete: async (reference) => { sessions.delete(reference); },
        }, { beginLogin: async () => { throw new Error('unused'); }, completeLogin: async () => { throw new Error('unused'); }, logout: async () => undefined }).execute('session-1');
        expect(sessions.has('session-1')).toBe(false);
        expect(sessions.has('session-2')).toBe(true);
    });

    it('denies direct navigation after the session is deleted and disables caching', async () => {
        const response = { headers: new Map<string, string>(), statusCode: 200, body: undefined as unknown, locals: {}, setHeader(name: string, value: string) { this.headers.set(name, value); return this; }, status(value: number) { this.statusCode = value; return this; }, json(value: unknown) { this.body = value; return this; } };
        let stored = true;
        await createRequireSessionMiddleware({ sessionCookie: new SecureCookieAdapter('sid', false), sessions: { get: async () => stored ? session : null, set: async () => undefined, delete: async () => { stored = false; } } })({ headers: { cookie: 'sid=opaque' } } as never, response as never, () => undefined);
        expect(response.statusCode).toBe(200);
        stored = false;
        const denied = { ...response, headers: new Map<string, string>(), statusCode: 200, body: undefined, locals: {}, setHeader: response.setHeader, status: response.status, json: response.json };
        await createRequireSessionMiddleware({ sessionCookie: new SecureCookieAdapter('sid', false), sessions: { get: async () => null, set: async () => undefined, delete: async () => undefined } })({ headers: { cookie: 'sid=opaque' } } as never, denied as never, () => undefined);
        expect(denied.statusCode).toBe(401);
        expect(denied.headers.get('Cache-Control')).toBe('no-store');
        expect(denied.headers.get('Pragma')).toBe('no-cache');
    });
});