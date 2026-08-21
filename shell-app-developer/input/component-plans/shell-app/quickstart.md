# Component Quickstart: C02 Shell App

## Prerequisites and Commands

Node.js 22 LTS, configured Keycloak/Redis, secret-store values, and private C01. From `apps/shell-app`: `npm ci; npm run lint; npm test; npm run build:ssr`.

## Focused Scenarios

1. Start without a session and verify redirect to Keycloak; complete callback and verify one rotated opaque cookie and protected C01 load.
2. Exercise missing/invalid state, nonce, PKCE, issuer, claim, and return path; verify no session and generic error.
3. Simulate Redis loss, provider outage, expired session, direct protected navigation, and spoofed identity headers; verify fail-closed behavior.
4. Verify manifest allow-list, C01 timeout/malformed response isolation, navigation denial, and trusted `BFF-UI-001` projection.
5. POST CSRF-protected logout; verify local invalidation precedes provider logout and repeated logout cannot restore access.
6. Inspect telemetry for redaction, correlation, outcome categories, bounded retries, and non-blocking delivery.

Expected outcome: unit suite, SSR build, and configured narrow `OIDC-001`/`BFF-UI-001`/`SHELL-NAV-001` checks pass. No password, code, token, session content, or raw provider response appears in browser or telemetry.

Root journey: [feature quickstart](../../quickstart.md).
