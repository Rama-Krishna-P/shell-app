# Developer Handoff Plan: Login and User Greeting

**Branch**: `001-login-greeting` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md) | **Architecture**: [architecture.md](architecture.md)

**Status**: Approved handoff  
**Scope**: full

## Summary

Deliver C02 as the browser-facing backend-for-frontend. C02 redirects unauthenticated users to Keycloak's hosted login, validates the OIDC callback, owns the server-side session, protects routes, and gateways authenticated requests to C01. C01 renders only the greeting and invokes C02 for sign-out. Keycloak remains the credential and identity authority. This file is the cross-component implementation index; component-specific decisions live in the linked bundles.

## Handoff Contents

- [Architecture overview](architecture.md)
- [C01 component plan](component-plans/login-greeting-web/plan.md)
- [C02 component plan](component-plans/shell-app/plan.md)
- [EXT01 component plan](component-plans/keycloak/plan.md)
- [Data model](data-model.md)
- [Contract index](contracts/README.md)
- [Quickstart validation](quickstart.md)
- [Research and decisions](research.md)

## Architecture Traceability

| Requirement or journey | Persona | Capability | Component(s) | Contract or data model |
|---|---|---|---|---|
| FR-001, FR-002 / US1, US2 | Registered user; visitor | User Authentication | C02, EXT01 | [browser-backend-gateway.md](contracts/browser-backend-gateway.md), [keycloak-oidc.md](contracts/keycloak-oidc.md) |
| FR-003, FR-004, FR-014, FR-015 / US1 | Registered user | User Authentication | C02, EXT01 | [keycloak-oidc.md](contracts/keycloak-oidc.md), [data-model.md](data-model.md) |
| FR-005, FR-006, FR-011 / US1 | Registered user | Personalized User Presentation | C02, C01 | [backend-frontend-gateway.md](contracts/backend-frontend-gateway.md) |
| FR-007 / US1, US3 | Registered user | Authenticated Access Control | C02 | [browser-backend-gateway.md](contracts/browser-backend-gateway.md), [data-model.md](data-model.md) |
| FR-008, FR-009 / US2 | Visitor | User Authentication | C02, EXT01 | [browser-backend-gateway.md](contracts/browser-backend-gateway.md), [keycloak-oidc.md](contracts/keycloak-oidc.md) |
| FR-010 / US3 | Registered user | Authenticated Access Control | C02 | [browser-backend-gateway.md](contracts/browser-backend-gateway.md) |
| FR-012, FR-013 / US2, US3 | Support or security operator | Authentication Auditability | C02, EXT01 | [security-telemetry.md](contracts/security-telemetry.md) |
| SC-001 to SC-005 | All personas | End-to-end feature outcome | C01, C02, EXT01 | [quickstart.md](quickstart.md) and component quickstarts |

## Technical Context

**Language and version**: TypeScript 5.x on Node.js 22 LTS. C02 uses Angular with `@angular/ssr`; C01 uses Angular as a standalone micro-app.

**Primary dependencies**: Angular CLI and `@angular/ssr` for Shell App rendering and hydration, a maintained server-side OIDC library for the Node SSR host, `ioredis` for the shared session store, Angular standalone APIs for C01, and the repository's TypeScript test/lint tooling. No custom cryptography or password protocol.

**Storage**: C02 owns server-side Authenticated Session records and transient OIDC transactions in Redis with TTLs. Keycloak owns accounts, credentials, provider sessions, and provider audit records. Observability owns telemetry retention. C01 has no persistence. No relational migration is required. See [data-model.md](data-model.md) and component data models.

**Testing strategy**: Unit tests by default for C02 state transitions, callback validation, session/cookie/CSRF policy, navigation and manifest authorization, C01 mounting/rendering, and telemetry redaction. Add narrow contract tests for Keycloak and Shell App-to-C01 only where configured.

**Target platforms**: Node.js 22 LTS, Angular SSR and standalone Angular micro-apps, current Chrome/Edge/Firefox/Safari on desktop and mobile.

**Performance and scale**: 95% of healthy login-to-greeting journeys complete within 2 seconds; C02 scales horizontally using shared Redis.

**Availability and resilience**: Bounded dependency timeouts; no credential retries; Redis loss and all protected dependency failures fail closed; C01 failures are isolated.

**Security and privacy**: Credentials and tokens remain in Keycloak/C02 server-side boundaries. Secure HttpOnly cookies, CSRF, PKCE, strict return paths, trusted identity projection, redaction, and least privilege are mandatory.

## Component Implementation Structure

| Component | Type | Source layout | Deployment unit | Configuration and secrets | Testing focus |
|---|---|---|---|---|---|
| C01 | [Frontend component plan](component-plans/login-greeting-web/plan.md) | Angular standalone micro-app | Private micro-app container | Shell App protocol only | [C01 test expectations](component-plans/login-greeting-web/plan.md) |
| C02 | [Backend component plan](component-plans/shell-app/plan.md) | Angular SSR shell and Node service | Public SSR shell container | OIDC, Redis, manifest, private transport; secrets in platform store | [C02 test expectations](component-plans/shell-app/plan.md) |
| EXT01 | [External component plan](component-plans/keycloak/plan.md) | Keycloak-managed realm/client | External identity platform | Realm/client/redirect/rate-limit configuration | Provider configuration and boundary tests |

## Delivery Sequence

1. Provision and validate EXT01 Keycloak configuration and C02 Redis/secret-store dependencies.
2. Implement C02 OIDC transactions, session aggregate, browser gateway, SSR shell, manifest policy, and telemetry.
3. Implement C01 against the versioned `BFF-UI-001` mount and identity projection.
4. Validate unit rules first, then the justified OIDC and C02-to-C01 boundary contracts, followed by the root quickstart journey.

## Risks and Open Decisions

| Risk or decision | Impact | Owner | Resolution required before implementation |
|---|---|---|---|
| Redis availability or scaling is insufficient | Session loss or inconsistent access decisions | Platform owner | Deploy shared Redis with TLS, TTL enforcement, monitoring, and fail-closed reads |
| Keycloak client configuration is incomplete | Login/callback/logout fails | Identity/platform owner | Provision the confidential client with issuer discovery, PKCE, exact redirects, claim mapping, and logout |
| C02-to-C01 private transport is misconfigured | Identity spoofing or direct access risk | Application/platform owner | Enforce private ingress, service authentication, header stripping, and contract version `v1` |
| Policy values differ between environments | Acceptance and operations become ambiguous | Product/security/operator owners | Version browser support, rate limits, CSRF, and telemetry retention in deployment configuration |

## Constitution Check

- [x] Persona journeys and measurable outcomes trace through architecture, components, contracts, and quickstart scenarios.
- [x] C01, C02, and Keycloak have explicit responsibilities, non-responsibilities, and owned data.
- [x] Every application boundary is represented by a versioned contract with failure behavior.
- [x] Authenticated Session and OIDC Transaction have explicit aggregate/consistency rules; no distributed transaction is used.
- [x] Security, privacy, observability, accessibility, resilience, and compatibility guidance is documented.
- [x] The BFF complexity is justified by server-owned sessions and the requirement to keep credentials and tokens out of the browser.

## Data Model Summary

| Data set | Owner | Consistency boundary | Retention | Migration concern |
|---|---|---|---|---|
| User Account and provider session | Keycloak | Provider transaction | Keycloak policy | External to this feature |
| Authenticated Session | C02 / Redis | Immediate per authorization read | Provider-derived expiry; Redis TTL | Versioned session values or planned invalidation |
| OIDC Transaction | C02 / Redis | Single callback transaction | Five minutes maximum | No migration; expired records are discarded |
| Greeting View Model | C01 | Request-scoped | None | No persistence |
| Authentication Event | Observability platform | Asynchronous delivery | Platform retention policy | Versioned event schema |

## Contract Summary

| Contract | Provider | Consumer | Version | Mode | Compatibility and failure behavior |
|---|---|---|---|---|---|
| Browser to BFF | C02 | Browser | v1 | Synchronous | Additive metadata is compatible; protected failures redirect or fail closed |
| OIDC boundary | Keycloak | C02 | OIDC-001 | Synchronous | Provider validation failure creates no session; logout is idempotent |
| Shell App to greeting micro-app | C02 | C01 | v1 | Synchronous private call or Angular mount lifecycle | Identity projection and lifecycle changes require coordinated security review; micro-app failure is generic and isolated |
| Security telemetry | C02 | Observability | v1 | Asynchronous/buffered | Delivery cannot affect authorization; required fields and redaction rules are versioned |

## Cross-Cutting Guidance

- **Security**: Keep passwords, codes, tokens, session contents, and raw provider responses server-side; rotate the session reference; validate CSRF and return paths; strip spoofable identity headers.
- **Observability**: Emit redacted versioned events and metrics for authentication outcomes, route denials, dependency failures, rate limiting, session-store health, and latency with correlation IDs.
- **Resilience**: Bound all dependency timeouts, never retry credential submission, allow only bounded metadata/session-read retries, and deny access on Redis loss.
- **Compatibility**: Version browser and internal contracts. Use compatible session reads or planned invalidation for schema changes. Keep C01 private during rollout.
- **Accessibility**: Use associated labels, keyboard operation, announced status/error content, predictable focus, and responsive layouts in C01; verify against the supported browser baseline.

## Completion Checklist

- [x] Architecture and every catalog component specification are linked and complete.
- [x] Every catalog component has a separate plan, research, data-model, quickstart, and contracts bundle.
- [x] Data ownership, consistency, lifecycle, retention, and migration concerns are documented.
- [x] Contracts identify provider, consumer, schema, security, compatibility, and failure behavior.
- [x] Quickstart scenarios cover success, failure, route protection, sign-out, safe rendering, accessibility, and performance.
- [x] Source layouts, deployment units, configuration ownership, and unit-test expectations are concrete.
- [x] No material clarification markers remain; no task list is generated or required for this handoff.
