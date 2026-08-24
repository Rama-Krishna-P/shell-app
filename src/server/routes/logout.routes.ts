import { Router } from 'express';
import { LogoutUseCase } from '../../application/auth/logout.use-case';
import { CsrfPort } from '../../application/ports';
import { SecureCookieAdapter } from '../../infrastructure/security/security-adapters';

export interface LogoutRouteOptions {
    readonly logout: LogoutUseCase;
    readonly sessionCookie: SecureCookieAdapter;
    readonly csrf: CsrfPort;
    readonly csrfHeader?: string;
}

export function createLogoutRouter(options: LogoutRouteOptions): Router {
    const router = Router();
    router.get('/csrf', (_request, response) => {
        response.setHeader('Cache-Control', 'no-store');
        response.json({ token: options.csrf.issue() });
    });
    router.post('/logout', async (request, response) => {
        const reference = options.sessionCookie.read(request.headers.cookie);
        const csrfToken = request.headers[(options.csrfHeader ?? 'x-csrf-token').toLowerCase()] as string | undefined;
        const bodyToken = typeof request.body?.csrfToken === 'string' ? request.body.csrfToken : undefined;
        const token = csrfToken ?? bodyToken;
        if (!reference || !options.csrf.verify(token, token ?? '')) {
            response.setHeader('Cache-Control', 'no-store');
            response.status(403).json({ authenticated: false, message: 'Unable to sign out.' });
            return;
        }

        const result = await options.logout.execute(reference);
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Clear-Site-Data', '"cache", "storage"');
        response.setHeader('Set-Cookie', options.sessionCookie.clear());
        response.redirect('/login' + (result.providerLogoutFailed ? '?signedOut=true' : ''));
    });
    return router;
}