import { Router, Request, Response } from 'express';
import { LoginEntryUseCase } from '../../application/auth/login-entry.use-case';
import { OidcCallbackUseCase } from '../../application/auth/oidc-callback.use-case';
import { SecureCookieAdapter } from '../../infrastructure/security/security-adapters';

export interface AuthRouteOptions {
    readonly login: LoginEntryUseCase;
    readonly callback: OidcCallbackUseCase;
    readonly sessionCookie: SecureCookieAdapter;
}

export function createAuthRouter(options: AuthRouteOptions): Router {
    const router = Router();
    router.get('/', (request, response) => handleLogin(options, request, response));
    router.get('/login', (request, response) => handleLogin(options, request, response));
    router.get('/auth/callback', async (request, response) => {
        const result = await options.callback.execute(request.query['code'], request.query['state']);
        if (!result.ok) console.warn('OIDC callback failed:', result.error);
        if (!result.ok) { response.status(400).send('Unable to complete sign-in.'); return; }
        response.setHeader('Set-Cookie', options.sessionCookie.serialize(result.value.sessionReference));
        response.redirect(result.value.returnPath);
    });
    return router;
}

async function handleLogin(options: AuthRouteOptions, request: Request, response: Response): Promise<void> {
    console.log('Login request received with returnTo:', request.query['returnTo']);
    const result = await options.login.execute(typeof request.query['returnTo'] === 'string' ? request.query['returnTo'] : '/');
    if (!result.ok) { response.status(503).send('Sign-in is temporarily unavailable.'); return; }
    response.redirect(result.value.authorizationUrl);
}