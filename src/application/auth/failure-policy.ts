import { AuthenticatedSession } from '../../domain/auth';

export const GENERIC_AUTH_FAILURE_MESSAGE = 'Unable to complete sign-in.';
export const GENERIC_DEPENDENCY_FAILURE_MESSAGE = 'Sign-in is temporarily unavailable.';
export const GENERIC_ROUTE_DENIED_MESSAGE = 'You must sign in to continue.';

export type AuthenticationFailure = 'invalid-credentials' | 'validation-failure' | 'rate-limited' | 'dependency-failure';

export interface SafeFailureResponse {
    readonly status: 400 | 401 | 429 | 503;
    readonly body: { readonly authenticated: false; readonly message: string };
}

export function mapAuthenticationFailure(error: AuthenticationFailure): SafeFailureResponse {
    if (error === 'rate-limited') return { status: 429, body: { authenticated: false, message: GENERIC_AUTH_FAILURE_MESSAGE } };
    if (error === 'dependency-failure') return { status: 503, body: { authenticated: false, message: GENERIC_DEPENDENCY_FAILURE_MESSAGE } };
    return { status: error === 'validation-failure' ? 400 : 401, body: { authenticated: false, message: GENERIC_AUTH_FAILURE_MESSAGE } };
}

export function isSessionAuthorized(session: AuthenticatedSession | null, now = Date.now()): boolean {
    return session !== null && session.active && session.expiresAt > now;
}