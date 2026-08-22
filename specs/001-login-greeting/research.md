# Research: Login and User Greeting

## Decision: Use Angular SSR with Node.js 22 and TypeScript 5.x

**Rationale:** The approved handoff specifies Angular SSR for the Shell App and
Angular standalone APIs for the greeting micro-app. SSR provides the browser
shell while preserving a server-only OIDC/session boundary.

**Alternatives considered:** A client-only OIDC SPA would expose browser token
handling and conflict with the server-owned session requirement. Other frameworks
were not selected because the approved architecture already standardizes Angular.

## Decision: Use server-side authorization-code OIDC with PKCE and Keycloak

**Rationale:** Keycloak remains authoritative for credentials and identity. A
maintained server OIDC adapter can validate issuer, client binding, redirect URI,
state, nonce, PKCE, signature, expiry, and token exchange without exposing
passwords or tokens to the browser.

**Alternatives considered:** Local credential validation and browser OIDC were
rejected because they violate the credential and server-session boundaries.

## Decision: Use shared TLS-enabled Redis

**Rationale:** Horizontal Shell App instances need shared, opaque,
server-controlled state for authenticated sessions and single-use five-minute
OIDC transactions. Redis TTLs support expiration and immediate invalidation.

**Alternatives considered:** In-memory sessions do not scale safely; browser JWTs
would expose authorization state and cannot satisfy the fail-closed store policy.

## Decision: Host an allow-listed private micro-app through a versioned contract

**Rationale:** Shell App owns navigation and authorization, while
`login-greeting-web` owns presentation. A manifest and private `BFF-UI-001` mount
boundary permit controlled extension and isolate load failures.

**Alternatives considered:** Direct browser-loaded arbitrary modules and embedding
the greeting in the shell were rejected because they weaken trust boundaries or
remove the required component boundary.

## Decision: Use focused deterministic unit tests plus narrow contract checks

**Rationale:** This follows the constitution. Unit tests cover policy behavior
without network, Redis, browsers, or real providers; narrow checks validate the
versioned OIDC, gateway, navigation, and telemetry contracts where configured.

**Alternatives considered:** A mandatory broad integration/E2E pipeline was
rejected by the constitution and is not required for this feature.