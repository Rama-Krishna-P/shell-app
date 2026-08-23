import {
    authorizationCodeGrant,
    buildAuthorizationUrl,
    ClientSecretBasic,
    discovery,
    allowInsecureRequests,
    randomNonce,
    randomPKCECodeVerifier,
    randomState,
    calculatePKCECodeChallenge,
    type Configuration,
} from 'openid-client';
import { OidcPort, TransactionRepository } from '../../application/ports';
import { BoundedUsername } from '../../domain/identity';
import { failure, Result, success } from '../../domain/result';
import { SafeReturnPath } from '../../domain/safe-return-path';

export interface OidcTransaction {
    readonly state: string;
    readonly nonce: string;
    readonly codeVerifier: string;
    readonly returnPath: string;
    readonly createdAt: number;
    readonly expiresAt: number;
}

export interface KeycloakOidcConfig {
    readonly issuerUrl: string;
    readonly clientId: string;
    readonly clientSecret: string;
    readonly redirectUri: string;
    readonly transactionTtlSeconds?: number;
}

export interface OidcProvider {
    discover(config: KeycloakOidcConfig): Promise<ProviderConfiguration>;
    authorizationUrl(provider: ProviderConfiguration, parameters: Record<string, string>): string;
    exchangeCode(
        provider: ProviderConfiguration,
        callbackUrl: string,
        checks: { expectedState: string; expectedNonce: string; codeVerifier: string },
    ): Promise<ProviderTokenResult>;
    logout(provider: ProviderConfiguration, providerSessionReference: string): Promise<void>;
}

export interface ProviderConfiguration {
    readonly configuration: Configuration;
    readonly issuer: string;
    readonly clientId: string;
    readonly redirectUri: string;
}

export interface ProviderTokenResult {
    readonly claims: Record<string, unknown>;
    readonly expiresIn?: number;
}

const DEFAULT_TRANSACTION_TTL_SECONDS = 300;
const MAX_TRANSACTION_TTL_SECONDS = 300;

function validHttpsUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || (process.env['SHELL_ALLOW_INSECURE_LOCAL'] === 'true' && url.protocol === 'http:' && url.hostname === 'localhost');
    } catch { return false; }
}

function sameUrl(left: string, right: string): boolean {
    try { return new URL(left).toString() === new URL(right).toString(); } catch { return false; }
}

function hasString(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }

function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        const cause = error.cause instanceof Error ? `; cause: ${error.cause.message}` : '';
        return `${error.name}: ${error.message}${cause}`;
    }
    return 'unknown error';
}

/** Default openid-client v6 provider implementation. Tokens are reduced to claims immediately. */
export class OpenIdClientProvider implements OidcProvider {
    async discover(config: KeycloakOidcConfig): Promise<ProviderConfiguration> {
        const configuration = await discovery(
            new URL(config.issuerUrl),
            config.clientId,
            { redirect_uris: [config.redirectUri] },
            ClientSecretBasic(config.clientSecret),
            ...(process.env['SHELL_ALLOW_INSECURE_LOCAL'] === 'true' ? [{ execute: [allowInsecureRequests] }] : []),
        );
        const issuer = configuration.serverMetadata().issuer;
        if (!sameUrl(issuer, config.issuerUrl)) throw new Error('OIDC issuer mismatch');
        if (configuration.clientMetadata().client_id !== config.clientId) throw new Error('OIDC client mismatch');
        return { configuration, issuer, clientId: config.clientId, redirectUri: config.redirectUri };
    }

    authorizationUrl(provider: ProviderConfiguration, parameters: Record<string, string>): string {
        return buildAuthorizationUrl(provider.configuration, parameters).toString();
    }

    async exchangeCode(provider: ProviderConfiguration, callbackUrl: string, checks: { expectedState: string; expectedNonce: string; codeVerifier: string }): Promise<ProviderTokenResult> {
        if (!sameUrl(new URL(callbackUrl).origin + new URL(callbackUrl).pathname, provider.redirectUri)) throw new Error('OIDC redirect mismatch');
        const tokens = await authorizationCodeGrant(provider.configuration, new URL(callbackUrl), {
            expectedState: checks.expectedState,
            expectedNonce: checks.expectedNonce,
            pkceCodeVerifier: checks.codeVerifier,
            idTokenExpected: true,
        });
        const claims = tokens.claims();
        if (!claims) throw new Error('OIDC ID token missing');
        return { claims: claims as Record<string, unknown>, expiresIn: tokens.expiresIn() };
    }

    async logout(provider: ProviderConfiguration, providerSessionReference: string): Promise<void> {
        // Provider logout requires an HTTP response context; the application orchestrates it.
        void provider;
        void providerSessionReference;
    }
}

export class KeycloakOidcAdapter implements OidcPort {
    private providerPromise?: Promise<ProviderConfiguration>;
    private readonly ttlSeconds: number;

    constructor(
        private readonly config: KeycloakOidcConfig,
        private readonly transactions: TransactionRepository<OidcTransaction>,
        private readonly provider: OidcProvider = new OpenIdClientProvider(),
        private readonly now: () => number = () => Date.now(),
    ) {
        this.ttlSeconds = config.transactionTtlSeconds ?? DEFAULT_TRANSACTION_TTL_SECONDS;
        if (this.ttlSeconds < 1 || this.ttlSeconds > MAX_TRANSACTION_TTL_SECONDS) throw new Error('OIDC transaction TTL must be at most five minutes');
        if (!validHttpsUrl(config.issuerUrl) || !validHttpsUrl(config.redirectUri) || !config.clientId || !config.clientSecret) throw new Error('Invalid OIDC configuration');
    }

    async beginLogin(returnPath: SafeReturnPath): Promise<Result<{ authorizationUrl: string; state: string }, 'dependency-failure' | 'validation-failure'>> {
        try {
            const provider = await this.getProvider();
            if (provider.clientId !== this.config.clientId || !sameUrl(provider.redirectUri, this.config.redirectUri) || !sameUrl(provider.issuer, this.config.issuerUrl)) return failure('validation-failure');
            const state = randomState();
            const nonce = randomNonce();
            const codeVerifier = randomPKCECodeVerifier();
            const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
            const createdAt = this.now();
            const transaction: OidcTransaction = { state, nonce, codeVerifier, returnPath: returnPath.value, createdAt, expiresAt: createdAt + this.ttlSeconds * 1000 };
            await this.transactions.set(state, transaction, this.ttlSeconds);
            const authorizationUrl = this.provider.authorizationUrl(provider, {
                client_id: this.config.clientId,
                redirect_uri: this.config.redirectUri,
                response_type: 'code',
                scope: 'openid',
                state,
                nonce,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
            });
            return success({ authorizationUrl, state });
        } catch (error) {
            console.warn('OIDC login initialization failed:', error instanceof Error ? error.message : 'unknown error');
            return failure('dependency-failure');
        }
    }

    async completeLogin(code: string, state: string, suppliedTransaction?: unknown): Promise<Result<{ subject: string; username: BoundedUsername; providerSessionReference: string; expiresAt: number }, 'validation-failure' | 'dependency-failure'>> {
        if (!hasString(code) || !hasString(state)) return failure('validation-failure');
        let transaction: OidcTransaction | null = suppliedTransaction as OidcTransaction | null;
        if (!transaction) {
            try { transaction = await this.transactions.consume(state); } catch { return failure('dependency-failure'); }
        }
        if (!transaction) return failure('validation-failure');
        if (transaction.state !== state || transaction.expiresAt <= this.now() || transaction.createdAt > this.now() || transaction.expiresAt - transaction.createdAt > MAX_TRANSACTION_TTL_SECONDS * 1000) return failure('validation-failure');
        try {
            const provider = await this.getProvider();
            const callbackUrl = new URL(this.config.redirectUri);
            callbackUrl.searchParams.set('code', code);
            callbackUrl.searchParams.set('state', state);
            // Keycloak can advertise authorization_response_iss_parameter_supported
            // while omitting `iss` from a standard code response. openid-client
            // rejects that response before the token request. The issuer here is
            // the value returned by validated discovery, not user input.
            callbackUrl.searchParams.set('iss', provider.issuer);
            const tokenResult = await this.provider.exchangeCode(provider, callbackUrl.toString(), { expectedState: state, expectedNonce: transaction.nonce, codeVerifier: transaction.codeVerifier });
            return this.mapClaims(tokenResult.claims, tokenResult.expiresIn);
        } catch (error) {
            // Keep the provider error visible while avoiding authorization codes,
            // tokens, and the transaction itself in application logs.
            console.warn('OIDC code exchange failed:', errorMessage(error));
            return failure('dependency-failure');
        }
    }

    async logout(providerSessionReference: string): Promise<void> {
        if (!hasString(providerSessionReference)) return;
        try { await this.provider.logout(await this.getProvider(), providerSessionReference); } catch { /* local invalidation is authoritative */ }
    }

    private async getProvider(): Promise<ProviderConfiguration> {
        this.providerPromise ??= this.provider.discover(this.config);
        return this.providerPromise;
    }

    private mapClaims(claims: Record<string, unknown>, expiresIn?: number): Result<{ subject: string; username: BoundedUsername; providerSessionReference: string; expiresAt: number }, 'validation-failure'> {
        const issuer = claims['iss'];
        const subject = claims['sub'];
        const audience = claims['aud'];
        const username = BoundedUsername.create(claims['preferred_username']);
        const sessionReference = claims['sid'];
        const exp = claims['exp'];
        if (!sameUrl(String(issuer), this.config.issuerUrl)) return failure('validation-failure');
        if (!hasString(subject)) return failure('validation-failure');
        if (!hasString(sessionReference)) return failure('validation-failure');
        if (!username.ok) return failure('validation-failure');
        if (!(typeof exp === 'number' && Number.isSafeInteger(exp) && exp > Math.floor(this.now() / 1000))) return failure('validation-failure');
        if (!(audience === this.config.clientId || (Array.isArray(audience) && audience.includes(this.config.clientId)))) return failure('validation-failure');
        if (typeof expiresIn === 'number' && expiresIn <= 0) return failure('validation-failure');
        return success({ subject, username: username.value, providerSessionReference: sessionReference, expiresAt: exp * 1000 });
    }
}
