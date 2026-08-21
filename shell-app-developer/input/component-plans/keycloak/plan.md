# Component Plan: EXT01 Keycloak

**Component**: EXT01 | **Type**: External identity provider | **Scope**: full

## Boundary and Traceability

Keycloak owns credential verification, User Account identity, provider sessions/tokens, provider defaults, and provider audit events. It supports C02 for US1-US3 and FR-003, FR-008, FR-014, FR-015. It does not own the C02 application session, greeting, navigation, or application telemetry schema. The source specification is [components/shell-app.md](../../components/shell-app.md) and the provider contract is [keycloak-oidc.md](../../contracts/keycloak-oidc.md).

## Implementation and Configuration

No repository source layout or application deployment unit is owned by this component: **N/A**. Configure a confidential server-side client using authorization code with PKCE, issuer discovery, exact redirect and post-logout URIs, `preferred_username`, HTTPS, provider-default session policy, and distributed failed-login abuse controls. Store client secrets in the platform secret store. C02 is the only consumer.

## Repository Structure

```text
specs/001-login-greeting/component-plans/keycloak/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/README.md

External platform boundary (not repository-owned application code):
Keycloak realm/
├── confidential-client-registration
├── hosted-login-theme-and-policy
├── session-and-logout-policy
├── abuse-control-policy
└── provider-audit-export
```

**Structure decision**: EXT01 has no repository-owned source, tests, database migrations, or deployable application unit. The repository owns only this architecture/configuration handoff; realm settings and provider operations remain platform-managed. C02 owns the adapter tests and the narrow `OIDC-001` boundary validation.

## Sequencing and Tests

Provision the realm/client and test account before C02 callback work. Validate discovery metadata, authorization request binding, invalid credential behavior, callback/token exchange, claim bounds, session expiry/revocation, logout, and provider audit export. Use unit tests for C02's adapter and a narrow configured contract test for provider behavior; no broad integration suite is required.

## Acceptance Traceability

- FR-003, FR-008, FR-014, FR-015 / US1-US2: Keycloak authenticates and supplies validated identity under provider policy.
- FR-013: Keycloak and approved edge policy enforce distributed failed-login abuse control.
- SC-002, SC-004: invalid credentials remain denied and provider/application telemetry excludes passwords.
