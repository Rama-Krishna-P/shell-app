import { describe, expect, it } from 'vitest';
import { createLogoutRouter } from '../../../src/server/routes/logout.routes';
import { SecureCookieAdapter } from '../../../src/infrastructure/security/security-adapters';

function postHandler(router: unknown): (request: unknown, response: unknown) => Promise<void> {
    const layer = (router as { stack: Array<{ route?: { path: string; stack: Array<{ handle: (request: unknown, response: unknown) => Promise<void> }> } }> }).stack.find((entry) => entry.route?.path === '/logout');
    return layer!.route!.stack[0].handle;
}

describe('US3 logout contract', () => {
    it('rejects missing CSRF and clears the cookie on successful logout', async () => {
        const router = createLogoutRouter({
            logout: { execute: async () => ({ localSessionInvalidated: true, providerLogoutFailed: false }) } as never,
            sessionCookie: new SecureCookieAdapter('sid', false),
            csrf: { issue: () => 'signed', verify: (token) => token === 'signed' },
        });
        const handler = postHandler(router);
        const denied = { headers: new Map<string, string>(), statusCode: 200, body: undefined as unknown, setHeader(name: string, value: string) { this.headers.set(name, value); return this; }, status(value: number) { this.statusCode = value; return this; }, json(value: unknown) { this.body = value; return this; }, redirect: () => undefined };
        await handler({ headers: { cookie: 'sid=opaque' } }, denied);
        expect(denied.statusCode).toBe(403);

        const response = { ...denied, headers: new Map<string, string>(), statusCode: 200, body: undefined, redirectPath: '', redirect(path: string) { this.redirectPath = path; } };
        await handler({ headers: { cookie: 'sid=opaque', 'x-csrf-token': 'signed' } }, response);
        expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0');
        expect(response.headers.get('Clear-Site-Data')).toBe('"cache", "storage"');
        expect(response.redirectPath).toBe('/login');
    });

    it('keeps the login redirect safe when provider logout fails', async () => {
        const router = createLogoutRouter({ logout: { execute: async () => ({ localSessionInvalidated: true, providerLogoutFailed: true }) } as never, sessionCookie: new SecureCookieAdapter('sid', false), csrf: { issue: () => 'signed', verify: (token) => token === 'signed' } });
        const response = { headers: new Map<string, string>(), setHeader(name: string, value: string) { this.headers.set(name, value); }, redirectPath: '', redirect(path: string) { this.redirectPath = path; } };
        await postHandler(router)({ headers: { cookie: 'sid=opaque', 'x-csrf-token': 'signed' } }, response);
        expect(response.redirectPath).toBe('/login?signedOut=true');
    });
});