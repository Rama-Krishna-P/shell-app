import { Router, Request, Response } from 'express';
import { LoginEntryUseCase } from '../../application/auth/login-entry.use-case';
import { OidcCallbackUseCase } from '../../application/auth/oidc-callback.use-case';
import { mapAuthenticationFailure } from '../../application/auth/failure-policy';
import { LoginRateLimitPolicy } from '../../application/security/login-rate-limit.policy';
import { SecureCookieAdapter } from '../../infrastructure/security/security-adapters';
import { AuthenticatedSession } from '../../domain/auth';
import { SessionRepository } from '../../application/ports';
import { isSessionAuthorized, GENERIC_ROUTE_DENIED_MESSAGE } from '../../application/auth/failure-policy';

export interface AuthRouteOptions {
    readonly login: LoginEntryUseCase;
    readonly callback: OidcCallbackUseCase;
    readonly sessionCookie: SecureCookieAdapter;
    readonly sessions: SessionRepository<AuthenticatedSession>;
    readonly rateLimit?: LoginRateLimitPolicy;
}

export function createAuthRouter(options: AuthRouteOptions): Router {
    const router = Router();
    router.get('/api/session', async (request, response) => {
        const reference = options.sessionCookie.read(request.headers.cookie);
        let session: AuthenticatedSession | null = null;
        try { session = reference ? await options.sessions.get(reference) : null; } catch { session = null; }
        if (!session || !isSessionAuthorized(session)) { response.status(401).json({ authenticated: false, message: GENERIC_ROUTE_DENIED_MESSAGE }); return; }
        response.json({ authenticated: true, username: session.username.value });
    });
    router.get('/login', (request, response) => handleLogin(options, request, response));
    router.get('/auth/callback', async (request, response) => {
        const result = await options.callback.execute(request.query['code'], request.query['state']);
        if (!result.ok) {
            const mapped = mapAuthenticationFailure(result.error);
            response.status(mapped.status).json(mapped.body);
            return;
        }
        response.setHeader('Set-Cookie', options.sessionCookie.serialize(result.value.sessionReference));
        response.redirect(result.value.returnPath);
    });
    return router;
}

async function handleLogin(options: AuthRouteOptions, request: Request, response: Response): Promise<void> {
    const rateLimitKey = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    if (options.rateLimit) {
        const decision = await options.rateLimit.check(rateLimitKey);
        if (!decision.ok) {
            const mapped = mapAuthenticationFailure(decision.error);
            response.status(mapped.status).json(mapped.body);
            return;
        }
    }
    const result = await options.login.execute(typeof request.query['returnTo'] === 'string' ? request.query['returnTo'] : '/');
    if (!result.ok) {
        const mapped = mapAuthenticationFailure(result.error);
        response.status(mapped.status).json(mapped.body);
        return;
    }
    response.redirect(result.value.authorizationUrl);
}