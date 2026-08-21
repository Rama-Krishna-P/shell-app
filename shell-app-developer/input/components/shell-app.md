# Component Specification: Shell App

**Component ID**: `C02`  
**Type**: Backend service  
**Status**: Approved handoff
**Architecture**: [../architecture.md](../architecture.md)

## Purpose and Scope

**Purpose**: Act as the browser-facing application shell and gateway, authenticate users through Keycloak, maintain the server-side application session, provide navigation, and load approved micro-apps including C01.

**Owned capabilities and decisions**: OIDC flow orchestration, callback validation, session lifecycle, protected-route policy, shell layout, navigation, micro-app registration/loading, CSRF policy, safe error mapping, and application security telemetry.

**Owned data**: Server-side Authenticated Session, opaque session reference, versioned allow-listed micro-app manifest/registry, transient OIDC transaction state, and redacted application events. It does not own User Accounts, credentials, or provider sessions.

**Responsibilities**:

- Redirect unauthenticated browser requests to Keycloak's hosted login page.
- Handle the OIDC callback and validate state, nonce, issuer, client binding, PKCE, signature, and expiry.
- Create and rotate an opaque Secure, HttpOnly session cookie only after successful validation.
- Validate the server session before protected access and fail closed.
- Render the authenticated shell and navigation entries.
- Resolve and load approved micro-apps with a server-derived identity projection.
- Isolate micro-app load failures without exposing unapproved entry locations.
- Provide idempotent sign-out, clear local session state, and initiate provider logout.
- Emit redacted security telemetry and generic user-safe errors.

**Explicit non-responsibilities**:

- Verifying passwords or owning authoritative identities; these belong to Keycloak.
- Rendering greeting presentation; this belongs to C01.
- Implementing business behavior owned by future micro-apps.
- Password reset, registration, MFA implementation, or role authorization beyond authenticated access.

## Personas and Journeys

| Persona | Journey | Component contribution | Acceptance outcome |
|---------|---------|------------------------|--------------------|
| Registered user | US1: Sign in and see greeting | Authenticates, creates session, guards and gateways request | Valid user reaches C01 with trusted username context |
| Unauthenticated visitor | US2: Recover from invalid sign-in | Redirects to Keycloak and maps failures generically | No session or greeting is created after failure |
| Registered user | US3: Sign out | Invalidates local session and starts provider logout | User returns to login and protected requests are denied |
| Support or security operator | US2/US3 operations | Emits redacted outcomes and dependency signals | Events support diagnosis without secrets |

## Domain and Data Model

`AuthenticatedSession` is a C02-owned aggregate rooted at an opaque session ID. It contains a validated provider subject, bounded username projection, provider-session reference managed by the OIDC library, creation/last-seen timestamps, and expiry metadata. Tokens remain server-side and are not returned to C01 or the browser. The session transitions `absent -> authenticating -> active -> invalidated`; validation failure, expiry, logout, or session-store failure results in no protected access. Session identifiers rotate on authentication and must not be accepted after invalidation.

`OidcTransaction` is transient state keyed by a short-lived, single-use state value. It is discarded on callback success, cancellation, timeout, or validation failure. `AuthenticationEvent` is versioned and redacted according to [security-telemetry.md](../contracts/security-telemetry.md).

`MicroAppManifest` is a C02-owned versioned allow-list. Each entry contains a stable app ID, route, display metadata, approved entry location, contract version, and health/lifecycle policy. A manifest entry is not an authorization grant; C02 still requires an active session and applies any future authorization policy before loading it.

## Interfaces and Contracts

### Inbound Interfaces

| Interface | Consumer | Purpose | Contract | Authentication and authorization |
|-----------|----------|---------|----------|----------------------------------|
| Browser application gateway | Browser user | Login entry, protected requests, callback, and logout | [../contracts/browser-backend-gateway.md](../contracts/browser-backend-gateway.md) | Public entry/callback; protected routes require valid C02 session; state changes require CSRF protection |

### Outbound Interfaces

| Interface | Provider | Purpose | Contract | Timeout, retry, and idempotency |
|-----------|----------|---------|----------|-------------------------------|
| OIDC authorization, callback, validation, logout | Keycloak | Authenticate and manage provider session | [../contracts/keycloak-oidc.md](../contracts/keycloak-oidc.md) | Synchronous; no credential retry; bounded metadata/session retry only; logout idempotent |
| Authenticated micro-app loading | C01 | Load the greeting micro-app inside Shell App | [../contracts/backend-frontend-gateway.md](../contracts/backend-frontend-gateway.md) | Bounded timeout; no unauthenticated retry or fallback; load failure is isolated |
| Micro-app navigation and registration | Future micro-app registry | Resolve approved navigation entries and entry locations | [../contracts/micro-app-navigation.md](../contracts/micro-app-navigation.md) | Manifest reads are bounded and cached only within policy; unknown entries are denied |
| Redacted security telemetry | Observability platform | Record application outcomes | [../contracts/security-telemetry.md](../contracts/security-telemetry.md) | Asynchronous/buffered; delivery cannot alter access |

## Dependencies and Interaction Behavior

For a request without a valid session, C02 redirects to Keycloak and preserves only a validated, allow-listed return path. Keycloak redirects the callback to C02, which performs the code exchange and response validation before creating a session and redirecting to the original path. On protected requests C02 reads the session store, validates provider/session freshness according to the configured strategy, resolves the selected manifest entry, strips inbound identity headers, injects a trusted identity context, and loads the selected micro-app. A missing, expired, revoked, malformed, or unavailable session fails closed. Unknown or unapproved micro-app routes are denied. A micro-app timeout or malformed response shows an isolated safe error while preserving the shell session. Logout invalidates local state first, clears the cookie, and then attempts provider logout; the result cannot restore access.

## Non-Functional Requirements

- **Security and privacy**: HTTPS, secure cookie flags, CSRF protection, session fixation prevention, strict return-path validation, no secret logging, fail-closed authorization, and least-privilege upstream identity propagation.
- **Performance and scale**: Meet the 2-second greeting target for 95% of healthy attempts; use bounded connection pools and avoid duplicate OIDC exchanges.
- **Availability and resilience**: Bounded timeouts for Keycloak, session store, and C01; no offline access; session-store failure denies protected access.
- **Observability**: Structured versioned events, latency/error metrics, dependency health, correlation IDs, and alerts separated by failure category.

## Implementation Structure

**Technology decisions**: Use TypeScript 5.x on Node.js 22 LTS with Angular SSR (`@angular/ssr`), Angular CLI, a maintained server-side OIDC library, and `ioredis`. The Node SSR host owns the OIDC/session server routes; Angular owns shell rendering, hydration, navigation UI, and micro-app lifecycle. Do not implement cryptography or password protocols.

**Source layout**: Organize Angular/browser code under `app/` and SSR/server code under `server/`, with supporting areas `auth/oidc`, `session/`, `shell/`, `navigation/`, `micro-apps/`, `security/`, and `telemetry/`; isolate provider, session-store, manifest, and micro-app adapters behind interfaces.

**Deployment and configuration**: Deploy C02/Shell App as the public application origin. Configure issuer discovery, confidential client ID/secret, redirect/logout URIs, cookie policy, TLS-enabled Redis endpoint, micro-app manifest/registry, approved C01 entry location, private service authentication, trusted identity context, timeouts, and allowed return paths. Secrets belong in the platform secret store. C02 scales horizontally with shared Redis; unavailable session reads fail closed.

**Testing expectations**: Unit tests for state transitions, callback validation, return-path allow-listing, cookie/session rotation, CSRF, fail-closed route guards, identity-header stripping, generic errors, logout idempotency, timeout handling, and telemetry redaction. Add narrow contract tests for Keycloak and C01 boundaries where configured.

## Acceptance Criteria

- [ ] Unauthenticated browser access redirects to Keycloak and never reaches C01.
- [ ] Only a fully validated OIDC callback creates a rotated server-side session.
- [ ] Protected requests require a valid session and are forwarded with a trusted bounded username projection.
- [ ] The authenticated shell exposes only allow-listed micro-app navigation entries and loads C01 as the first micro-app.
- [ ] Future micro-app entries can be added through the versioned manifest without moving OIDC, session, or navigation ownership into the micro-app.
- [ ] Session, token, code, password, and raw provider response values never reach the browser, C01, logs, or telemetry.
- [ ] Invalid, expired, revoked, malformed, or unavailable session state fails closed.
- [ ] Sign-out invalidates local state immediately, attempts provider logout, and is idempotent.
- [ ] Unit and boundary tests cover security, resilience, and telemetry requirements.

## Deployment Decisions

- Keycloak uses a confidential authorization-code client with PKCE, issuer discovery, `preferred_username`, and provider-default logout/session behavior.
- Redis is the shared TLS-enabled session store; credentials and encryption configuration are supplied by the platform secret store; unavailable reads fail closed.
- C01 is private-network-only and receives the versioned `BFF-UI-001` identity projection over authenticated C02 service traffic.
