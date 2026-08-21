# Component Specification: Keycloak Identity Provider

**Component ID**: `EXT01`  
**Type**: External identity provider  
**Status**: Approved handoff
**Architecture**: [../architecture.md](../architecture.md)

## Purpose and Scope

Keycloak authenticates registered users and owns provider identity, credentials, provider sessions, tokens, session policy, and provider audit records. It is consumed by C02 through the server-side [OIDC-001 contract](../contracts/keycloak-oidc.md).

## Responsibilities and Non-Responsibilities

Keycloak verifies credentials, hosts the login experience, issues and revokes OIDC artifacts, applies configured session and abuse-control policy, and exposes provider audit events through provider-native operations.

It does not own the C02 application session, browser cookies, Shell App navigation, greeting presentation, C01 loading, or the application telemetry schema. C02 never receives or proxies user passwords.

## Personas and Journeys

Keycloak supports the registered-user authentication journey US1, invalid-sign-in recovery US2, and sign-out US3. It also supports the operator journey through provider audit events and configured abuse-control outcomes. C02 remains responsible for translating these outcomes into application behavior.

## Data Ownership and Invariants

- `UserAccount`, credentials, provider sessions/tokens, and provider audit records are Keycloak-owned.
- Credential verification occurs only within Keycloak; credentials never enter C02 or C01.
- Provider expiration, inactivity, renewal, revocation, and logout follow configured Keycloak defaults.
- The `preferred_username` claim consumed by C02 is validated and bounded before becoming an application projection.

Provider data lifecycle, retention, and migration remain governed by Keycloak realm policy. Detailed component data guidance is in [component-plans/keycloak/data-model.md](../component-plans/keycloak/data-model.md).

## Interfaces and Security

The integration uses HTTPS OpenID Connect authorization code with PKCE, issuer discovery, exact redirect and post-logout URIs, and a confidential server-side client. C02 validates issuer, client binding, redirect URI, state, nonce, PKCE, signature, expiry, and required claims. Invalid, cancelled, expired, or malformed flows fail without creating a C02 session.

The authoritative schema, validation, timeout/retry/idempotency, compatibility, and failure behavior are defined in [contracts/keycloak-oidc.md](../contracts/keycloak-oidc.md). The component contract bundle is [component-plans/keycloak/contracts/README.md](../component-plans/keycloak/contracts/README.md).

## Non-Functional Requirements

- **Security**: HTTPS, confidential client protection, no password disclosure, provider-controlled abuse policy, and no raw token or response logging.
- **Availability**: C02 uses bounded provider timeouts and fails closed when validation or exchange is unavailable.
- **Observability**: Provider audit export must remain redacted and access-controlled; C02 owns application event mapping.
- **Compatibility**: Changes to issuer, client registration, claim mapping, redirect URIs, or session policy require coordinated C02 review.

## Acceptance Criteria

- [ ] Valid hosted login produces a callback that C02 can exchange and validate once.
- [ ] Invalid credentials and malformed callbacks do not create an application session.
- [ ] Required identity claims are available and bounded according to the OIDC contract.
- [ ] Provider defaults govern expiration, renewal, revocation, and logout.
- [ ] Failed-login abuse control and provider audit export are configured and operationally testable.
- [ ] No password is copied into application configuration, logs, browser state, or telemetry.