# Quickstart and Validation: Login and User Greeting

## Prerequisites

- Node.js 22 LTS and npm.
- Angular CLI compatible with the pinned Angular workspace version.
- A configured Keycloak realm/client with HTTPS issuer discovery, authorization-code + PKCE support, approved redirect URI, post-logout redirect URI, allowed origin, and username claim mapping.
- A registered test user and a test account with invalid credentials.
- Angular SSR Shell App scaffold under `apps/shell-app/` and Angular micro-app scaffold under `apps/login-greeting-web/`.

## Environment

Provide non-secret configuration through the application's environment mechanism:

```text
OIDC_ISSUER_URL=https://keycloak.example/realms/example
OIDC_CLIENT_ID=login-greeting-backend
OIDC_REDIRECT_URI=https://app.example/auth/callback
OIDC_POST_LOGOUT_REDIRECT_URI=https://app.example/login
OIDC_USERNAME_CLAIM=preferred_username
SESSION_STORE_URL=rediss://session-store.example:6379
GREETING_FRONTEND_URL=http://login-greeting-web:8080
SESSION_COOKIE_NAME=login_greeting_session
SESSION_TRANSACTION_TTL_SECONDS=300
USERNAME_MAX_LENGTH=128
ALLOWED_RETURN_PATH_PREFIX=/
```

Do not place client secrets, passwords, tokens, authorization codes, or refresh tokens in source control or browser-visible configuration.

## Commands

From the repository root on macOS/Linux:

```sh
cd apps/shell-app && npm ci && npm run lint && npm test && npm run build:ssr
cd ../login-greeting-web && npm ci && npm run lint && npm test && npm run build
```

Expected result: lint, unit tests, Angular SSR production build, and Angular micro-app production build succeed; the Shell App SSR server exposes the configured local URL.

For local development, run the Angular C01 micro-app on its private micro-app port and the Angular SSR C02/Shell App on the browser-facing port. Configure Keycloak's redirect URI as `https://localhost:<c02-port>/auth/callback`; do not expose Redis or C01 directly to the browser. Use TLS for Redis locally as well, or document the deliberate local-only non-TLS exception in environment configuration. Verify the initial shell HTML is server-rendered and that hydration completes without duplicating the session or micro-app mount.

## Validation Scenarios

1. **Successful authentication**: Open the login entry, complete the Keycloak login with the valid test account, and verify the callback reaches the protected greeting containing the configured username as text. Confirm a redacted success event is emitted.
2. **Hosted login and failure**: Submit missing or invalid values on Keycloak's hosted login page. Verify no C02 session or greeting is created, the user receives generic feedback, and no password is retained or logged.
3. **Invalid credentials**: Use the invalid test account. Verify the user remains unauthenticated, sees one generic error, sees no greeting content, and telemetry contains no password or account-enumeration detail.
4. **Route protection**: Open the application/greeting route in a fresh browser context and after session expiration/revocation. Verify C02 redirects to Keycloak and C01 is never reached. Simulate provider, session-store, and frontend failures and verify fail-closed behavior.
5. **Sign-out**: Authenticate, select sign-out, verify local state is cleared and the user returns to login. Reopen the greeting route and verify authentication is required again even if provider logout reports an error.
6. **Safe rendering**: Use a test username containing characters such as `<` and `&` through a controlled Keycloak test account. Verify C02 forwards only the bounded projection and C01 displays literal text with no DOM markup.
7. **Accessibility**: Verify labels, keyboard-only submission, focus after validation/error/navigation, and announced error/status content against the approved accessibility baseline.
8. **Performance and operations**: Exercise normal successful login and confirm the 95th-percentile success-to-greeting target is within 2 seconds when Keycloak is available. Verify metrics distinguish invalid credentials, rate limiting, and provider failure.
9. **Shell navigation**: After authentication, verify Shell App displays the allow-listed `login-greeting-web` entry and mounts it at its registered route. Verify an unknown or unapproved route is denied without loading an arbitrary entry location.
10. **Micro-app failure isolation**: Make the C01 entry unavailable or exceed its load timeout. Verify Shell App shows a generic micro-app error, records a redacted `micro-app-load-failure`, and keeps sign-out and shell navigation usable.

## Contract References

- OIDC provider boundary: [keycloak-oidc.md](contracts/keycloak-oidc.md)
- Browser-to-backend behavior: [browser-backend-gateway.md](contracts/browser-backend-gateway.md)
- Backend-to-frontend behavior: [backend-frontend-gateway.md](contracts/backend-frontend-gateway.md)
- Shell navigation and micro-app lifecycle: [micro-app-navigation.md](contracts/micro-app-navigation.md)
- Redacted events: [security-telemetry.md](contracts/security-telemetry.md)
- State and ownership rules: [data-model.md](data-model.md)

## Component Validation Index

- [C01 quickstart](component-plans/login-greeting-web/quickstart.md): rendering, mount lifecycle, denial, sign-out, and accessibility states.
- [C02 quickstart](component-plans/shell-app/quickstart.md): OIDC/session, route protection, gateway, navigation, resilience, and telemetry.
- [EXT01 quickstart](component-plans/keycloak/quickstart.md): realm/client, hosted login, discovery, callback, logout, and provider policy checks.

The scenarios above are the component-focused checks; this root quickstart remains the primary cross-component journey and measurable-outcome validation.
