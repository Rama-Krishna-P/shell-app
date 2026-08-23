import { describe, expect, it, vi } from 'vitest';
import { KeycloakOidcAdapter, OidcProvider, OidcTransaction, ProviderConfiguration, ProviderTokenResult } from '../../../src/infrastructure/oidc/keycloak-oidc';
import { SafeReturnPath } from '../../../src/domain/safe-return-path';
import { TransactionRepository } from '../../../src/application/ports';

class MemoryTransactions implements TransactionRepository<OidcTransaction> {
    readonly values = new Map<string, OidcTransaction>();
    async get(reference: string) { return this.values.get(reference) ?? null; }
    async set(reference: string, value: OidcTransaction) { this.values.set(reference, value); }
    async delete(reference: string) { this.values.delete(reference); }
    async consume(reference: string) { const value = this.values.get(reference) ?? null; this.values.delete(reference); return value; }
}

const config = { issuerUrl: 'https://keycloak.example/realms/app', clientId: 'shell', clientSecret: 'secret', redirectUri: 'https://shell.example/auth/callback' } as const;
const providerConfiguration = { issuer: config.issuerUrl, clientId: config.clientId, redirectUri: config.redirectUri, configuration: {} as ProviderConfiguration['configuration'] };
const returnPath = SafeReturnPath.create('/');
if (!returnPath.ok) throw new Error('test return path setup failed');

function provider(result: ProviderTokenResult): OidcProvider {
    return {
        discover: vi.fn(async () => providerConfiguration),
        authorizationUrl: vi.fn((_provider, parameters) => `https://keycloak.example/auth?state=${parameters['state']}`),
        exchangeCode: vi.fn(async () => result),
        logout: vi.fn(async () => undefined),
    };
}

describe('KeycloakOidcAdapter', () => {
    it('creates a PKCE transaction and server-side authorization URL without tokens', async () => {
        const transactions = new MemoryTransactions();
        const oidc = new KeycloakOidcAdapter(config, transactions, provider({ claims: {} }));
        const result = await oidc.beginLogin(returnPath.value);
        expect(result.ok).toBe(true);
        expect(transactions.values.size).toBe(1);
        expect(result.ok && result.value.authorizationUrl).not.toContain('token');
        expect(result.ok && result.value.state).toBe([...transactions.values.keys()][0]);
    });

    it('atomically consumes a valid transaction and validates issuer, audience, expiry, subject, sid, and username', async () => {
        const transactions = new MemoryTransactions();
        const now = 1_700_000_000_000;
        const oidcProvider = provider({ claims: { iss: config.issuerUrl, aud: config.clientId, sub: 'subject-1', sid: 'provider-session-1', preferred_username: 'alice', exp: now / 1000 + 60 }, expiresIn: 60 });
        const oidc = new KeycloakOidcAdapter(config, transactions, oidcProvider, () => now);
        const begin = await oidc.beginLogin(returnPath.value);
        if (!begin.ok) throw new Error('login setup failed');
        const first = await oidc.completeLogin('authorization-code', begin.value.state);
        const second = await oidc.completeLogin('authorization-code', begin.value.state);
        expect(first.ok).toBe(true);
        expect(second).toEqual({ ok: false, error: 'validation-failure' });
        expect(oidcProvider.exchangeCode).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('code=authorization-code'), expect.objectContaining({ expectedState: begin.value.state, expectedNonce: expect.any(String), codeVerifier: expect.any(String) }));
    });

    it.each([
        { name: 'wrong issuer', claims: { iss: 'https://evil.example', aud: config.clientId, sub: 's', sid: 'sid', preferred_username: 'alice', exp: 1_700_000_060 } },
        { name: 'wrong audience', claims: { iss: config.issuerUrl, aud: 'other', sub: 's', sid: 'sid', preferred_username: 'alice', exp: 1_700_000_060 } },
        { name: 'missing preferred username', claims: { iss: config.issuerUrl, aud: config.clientId, sub: 's', sid: 'sid', exp: 1_700_000_060 } },
        { name: 'expired token', claims: { iss: config.issuerUrl, aud: config.clientId, sub: 's', sid: 'sid', preferred_username: 'alice', exp: 1_699_999_999 } },
    ])('rejects $name', async ({ claims }) => {
        const transactions = new MemoryTransactions();
        const oidc = new KeycloakOidcAdapter(config, transactions, provider({ claims }), () => 1_700_000_000_000);
        const begin = await oidc.beginLogin(returnPath.value);
        if (!begin.ok) throw new Error('login setup failed');
        expect(await oidc.completeLogin('code', begin.value.state)).toEqual({ ok: false, error: 'validation-failure' });
    });
});
