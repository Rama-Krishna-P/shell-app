import { describe, expect, it } from 'vitest';
import { OidcCallbackUseCase } from '../../../src/application/auth/oidc-callback.use-case';
import { LoginEntryUseCase } from '../../../src/application/auth/login-entry.use-case';
import { BoundedUsername } from '../../../src/domain/identity';
import { OidcPort, SessionRepository, TransactionRepository } from '../../../src/application/ports';
import { OidcTransaction, AuthenticatedSession } from '../../../src/domain/auth';

const usernameResult = BoundedUsername.create('Ada');
if (!usernameResult.ok) throw new Error('test fixture username must be valid');
const username = usernameResult.value;
const transaction: OidcTransaction = { state: 'state', returnPath: '/', createdAt: 0, expiresAt: 10_000 };

describe('US1 authentication use cases', () => {
    it('validates safe login paths', async () => {
        const oidc = { beginLogin: async () => ({ ok: true as const, value: { authorizationUrl: 'https://idp.test/auth', state: 'state' } }), completeLogin: async () => ({ ok: false as const, error: 'validation-failure' as const }), logout: async () => undefined } satisfies OidcPort;
        const useCase = new LoginEntryUseCase(oidc);
        expect((await useCase.execute('https://evil.test')).ok).toBe(false);
        expect((await useCase.execute('/protected')).ok).toBe(true);
    });

    it('consumes the transaction and writes a rotated opaque session', async () => {
        let consumed = false;
        let stored: AuthenticatedSession | undefined;
        const transactions: TransactionRepository<OidcTransaction> = {
            get: async () => transaction, set: async () => undefined, delete: async () => undefined,
            consume: async () => { consumed = true; return transaction; },
        };
        const sessions: SessionRepository<AuthenticatedSession> = {
            get: async () => stored ?? null, set: async (_reference, value) => { stored = value; }, delete: async () => undefined,
        };
        const oidc = { beginLogin: async () => ({ ok: false as const, error: 'validation-failure' as const }), completeLogin: async () => ({ ok: true as const, value: { subject: 'subject', username, providerSessionReference: 'provider', expiresAt: 10_000 } }), logout: async () => undefined } satisfies OidcPort;
        const result = await new OidcCallbackUseCase({ oidc, transactions, sessions, now: () => 1_000, newSessionReference: () => 'opaque-reference' }).execute('code', 'state');
        expect(result.ok).toBe(true);
        expect(consumed).toBe(true);
        expect(stored?.username.value).toBe('Ada');
        if (result.ok) expect(result.value.sessionReference).toBe('opaque-reference');
    });
});