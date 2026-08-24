import { AuthenticatedSession } from '../../domain/auth';
import { OidcPort, SessionRepository } from '../ports';

export interface LogoutResult {
    readonly localSessionInvalidated: boolean;
    readonly providerLogoutFailed: boolean;
}

export class LogoutUseCase {
    constructor(
        private readonly sessions: SessionRepository<AuthenticatedSession>,
        private readonly oidc: OidcPort,
    ) { }

    async execute(sessionReference: string | null): Promise<LogoutResult> {
        if (!sessionReference) return { localSessionInvalidated: false, providerLogoutFailed: false };

        let session: AuthenticatedSession | null = null;
        try { session = await this.sessions.get(sessionReference); } catch { session = null; }

        let localSessionInvalidated = true;
        try { await this.sessions.delete(sessionReference); } catch { localSessionInvalidated = false; }
        if (!localSessionInvalidated) return { localSessionInvalidated: false, providerLogoutFailed: true };

        if (!session) return { localSessionInvalidated: true, providerLogoutFailed: false };
        try {
            await this.oidc.logout(session.providerSessionReference);
            return { localSessionInvalidated: true, providerLogoutFailed: false };
        } catch {
            return { localSessionInvalidated: true, providerLogoutFailed: true };
        }
    }
}