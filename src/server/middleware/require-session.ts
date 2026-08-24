import { RequestHandler } from 'express';
import { AuthenticatedSession } from '../../domain/auth';
import { isSessionAuthorized, GENERIC_ROUTE_DENIED_MESSAGE } from '../../application/auth/failure-policy';
import { SessionRepository } from '../../application/ports';
import { SecureCookieAdapter } from '../../infrastructure/security/security-adapters';

export interface RequireSessionOptions {
    readonly sessionCookie: SecureCookieAdapter;
    readonly sessions: SessionRepository<AuthenticatedSession>;
    readonly now?: () => number;
}

export function createRequireSessionMiddleware(options: RequireSessionOptions): RequestHandler {
    return async (request, response, next) => {
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('Vary', 'Cookie');
        const reference = options.sessionCookie.read(request.headers.cookie);
        let session: AuthenticatedSession | null = null;
        try {
            session = reference ? await options.sessions.get(reference) : null;
        } catch {
            session = null;
        }
        if (!isSessionAuthorized(session, options.now?.() ?? Date.now())) {
            response.status(401).json({ authenticated: false, message: GENERIC_ROUTE_DENIED_MESSAGE });
            return;
        }
        response.locals['session'] = session;
        next();
    };
}