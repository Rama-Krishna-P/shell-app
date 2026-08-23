import { randomBytes } from 'node:crypto';
import { OidcTransaction, AuthenticatedSession } from '../../domain/auth';
import { failure, Result, success } from '../../domain/result';
import { OidcPort, SessionRepository, TransactionRepository } from '../ports';

export interface CallbackResult {
    readonly sessionReference: string;
    readonly returnPath: string;
    readonly session: AuthenticatedSession;
}

export interface OidcCallbackDependencies {
    readonly oidc: OidcPort;
    readonly transactions: TransactionRepository<OidcTransaction>;
    readonly sessions: SessionRepository<AuthenticatedSession>;
    readonly sessionTtlSeconds?: number;
    readonly now?: () => number;
    readonly newSessionReference?: () => string;
}

export class OidcCallbackUseCase {
    constructor(private readonly dependencies: OidcCallbackDependencies) { }

    async execute(code: unknown, state: unknown): Promise<Result<CallbackResult, 'validation-failure' | 'dependency-failure'>> {
        if (typeof code !== 'string' || !code || typeof state !== 'string' || !state) return failure('validation-failure');
        const transaction = await this.dependencies.transactions.consume(state);
        if (!transaction) {
            console.warn('OIDC callback validation failed: transaction missing or already consumed');
            return failure('validation-failure');
        }
        if (transaction.expiresAt <= (this.dependencies.now?.() ?? Date.now())) {
            console.warn('OIDC callback validation failed: transaction expired');
            return failure('validation-failure');
        }
        const identity = await this.dependencies.oidc.completeLogin(code, state, transaction);
        if (!identity.ok) return identity;
        const now = this.dependencies.now?.() ?? Date.now();
        const session: AuthenticatedSession = {
            subject: identity.value.subject,
            username: identity.value.username,
            providerSessionReference: identity.value.providerSessionReference,
            createdAt: now,
            expiresAt: identity.value.expiresAt,
            active: true,
        };
        const reference = this.dependencies.newSessionReference?.() ?? randomBytes(32).toString('base64url');
        try {
            await this.dependencies.sessions.set(reference, session, this.dependencies.sessionTtlSeconds ?? Math.max(1, Math.ceil((session.expiresAt - now) / 1000)));
            return success({ sessionReference: reference, returnPath: transaction.returnPath, session });
        } catch {
            return failure('dependency-failure');
        }
    }
}