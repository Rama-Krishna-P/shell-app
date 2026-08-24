import {
    AngularNodeAppEngine,
    createNodeRequestHandler,
    isMainModule,
    writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import express from 'express';
import { LoginEntryUseCase } from './application/auth/login-entry.use-case';
import { OidcCallbackUseCase } from './application/auth/oidc-callback.use-case';
import { AuthenticatedSession, OidcTransaction as CallbackTransaction } from './domain/auth';
import { OidcTransaction } from './infrastructure/oidc/keycloak-oidc';
import { TransactionRepository } from './application/ports';
import { loadRuntimeConfig } from './infrastructure/config/runtime-config';
import { KeycloakOidcAdapter } from './infrastructure/oidc/keycloak-oidc';
import { createRedisConnection, RedisLoginRateLimitAdapter, RedisSessionRepository, RedisTransactionRepository } from './infrastructure/session/redis-repositories';
import { LoginRateLimitPolicy } from './application/security/login-rate-limit.policy';
import { SecureCookieAdapter } from './infrastructure/security/security-adapters';
import { createAuthRouter } from './server/routes/auth.routes';

// Load local overrides first, then fall back to the standard `.env` file.
// Existing process environment variables are not overwritten.
const dotenvPath = existsSync('.env.local') ? '.env.local' : '.env';
loadDotenv({ path: dotenvPath });

const app = express();
const angularApp = new AngularNodeAppEngine();
const browserAssets = join(dirname(fileURLToPath(import.meta.url)), '../browser');
app.use(express.static(browserAssets, { index: false }));

// The application composition supplies real use cases and adapters at runtime.
// This router is intentionally mounted by the deployment composition root.
export { createAuthRouter };

// Register application routes before the Angular fallback. Previously the
// router was exported but never mounted, so `/login` fell through to SSR and
// returned 404. Configuration is intentionally read only on the server.
const runtimeConfig = loadRuntimeConfig();
if (runtimeConfig.ok && process.env['SHELL_OIDC_CLIENT_SECRET']) {
    const redis = createRedisConnection(runtimeConfig.value.redisUrl);
    const transactions = new RedisTransactionRepository<OidcTransaction>(redis);
    const sessions = new RedisSessionRepository<AuthenticatedSession>(redis);
    const oidc = new KeycloakOidcAdapter({
        issuerUrl: runtimeConfig.value.issuerUrl,
        clientId: runtimeConfig.value.clientId,
        clientSecret: process.env['SHELL_OIDC_CLIENT_SECRET'],
        redirectUri: runtimeConfig.value.redirectUri,
    }, transactions);
    const authRouter = createAuthRouter({
        login: new LoginEntryUseCase(oidc),
        callback: new OidcCallbackUseCase({
            oidc,
            transactions: transactions as unknown as TransactionRepository<CallbackTransaction>,
            sessions,
        }),
        sessionCookie: new SecureCookieAdapter(runtimeConfig.value.cookieName, runtimeConfig.value.redirectUri.startsWith('https:')),
        sessions,
        rateLimit: new LoginRateLimitPolicy(new RedisLoginRateLimitAdapter(redis)),
    });
    app.use(authRouter);
} else {
    app.get('/login', (_request, response) => response.status(503).send('Sign-in is not configured.'));
}

// Express 5 no longer accepts the unnamed `*` path pattern. Omitting the
// path mounts this final SSR handler for every request.
app.use((request, response, next) => {
    angularApp
        .handle(request)
        .then((result) => (result ? writeResponseToNodeResponse(result, response) : next()))
        .catch(next);
});

if (isMainModule(import.meta.url))
    app.listen(4000, () => console.log('SSR server listening on http://localhost:4000'));
export const reqHandler = createNodeRequestHandler(app);
