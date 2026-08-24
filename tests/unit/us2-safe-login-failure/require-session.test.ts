import { describe, expect, it } from 'vitest';
import { createRequireSessionMiddleware } from '../../../src/server/middleware/require-session';
import { SecureCookieAdapter } from '../../../src/infrastructure/security/security-adapters';

function responseStub() {
    const response = {
        headers: new Map<string, string>(),
        statusCode: 200,
        body: undefined as unknown,
        setHeader(name: string, value: string) { this.headers.set(name, value); return this; },
        status(value: number) { this.statusCode = value; return this; },
        json(value: unknown) { this.body = value; return this; },
        locals: {} as Record<string, unknown>,
    };
    return response;
}

describe('require-session middleware', () => {
    it('denies unreadable sessions with generic no-store feedback', async () => {
        const response = responseStub();
        let called = false;
        await createRequireSessionMiddleware({ sessionCookie: new SecureCookieAdapter('sid', false), sessions: { get: async () => { throw new Error('store unavailable'); }, set: async () => undefined, delete: async () => undefined } })({ headers: { cookie: 'sid=opaque' } } as never, response as never, () => { called = true; });
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({ authenticated: false, message: 'You must sign in to continue.' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(called).toBe(false);
    });
});