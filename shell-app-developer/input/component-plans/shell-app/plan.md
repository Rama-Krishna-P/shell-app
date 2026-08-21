# Component Plan: C02 Shell App

**Component**: C02 | **Type**: Angular SSR host and Node.js backend service | **Scope**: full

## Boundary and Traceability

C02 is the public application origin, BFF, session authority, navigation owner, and C01 host. It implements US1, US2, US3 and FR-001 through FR-013, while EXT01 owns credential verification and identity. It must not own passwords, User Accounts, provider session authority, or greeting presentation. Acceptance is traced in [components/shell-app.md](../../components/shell-app.md).

## Source and Dependencies

Use `apps/shell-app/src/{app,server,auth/oidc,session,shell,navigation,micro-apps,security,telemetry}`. Use TypeScript 5.x, Node.js 22 LTS, Angular CLI, `@angular/ssr`, a maintained server-side OIDC library, and `ioredis`. Keep domain policies behind interfaces for OIDC, Redis, manifest, micro-app transport, cookies, CSRF, and telemetry.

## Repository Structure

```text
apps/shell-app/
├── angular.json
├── package.json
├── tsconfig.json
├── src/
│   ├── app/
│   ├── server/
│   ├── auth/oidc/
│   ├── session/
│   ├── shell/
│   ├── navigation/
│   ├── micro-apps/
│   ├── security/
│   └── telemetry/
├── public/
├── tests/unit/
└── deploy/
	├── config/
	└── manifests/
specs/001-login-greeting/component-plans/shell-app/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/README.md
```

**Structure decision**: C02 keeps Angular SSR/browser composition under `src/app` and server-only authentication/session behavior under `src/server` and its policy adapters. Deployment configuration is separate from application code; no shared session or OIDC implementation is placed in a cross-component package.

## Configuration and Deployment

Deploy as the public SSR container with HTTPS. Configure issuer discovery, confidential client ID/secret, exact callback/logout URIs, cookie/CSRF policy, TLS Redis, manifest and private C01 entry, service authentication, timeouts, return-path allow-list, rate-limit policy, and telemetry sink. Secrets use the platform secret store. Horizontal scaling requires shared Redis; unavailable reads deny protected access.

## Sequencing and Tests

Provision EXT01 and Redis first. Implement OIDC transaction and session aggregates, then browser gateway/SSR guards, manifest/navigation and C01 adapter, then telemetry and operational policy. Unit-test callback validation, return paths, PKCE/state/nonce, session rotation and transitions, CSRF, fail-closed reads, header stripping, manifest allow-list, generic errors, logout idempotency, timeout/retry rules, and telemetry redaction. Add narrow `OIDC-001`, `BFF-UI-001`, and `SHELL-NAV-001` contract tests only where configured.

## Acceptance Traceability

- FR-001 through FR-004, FR-008, FR-009, FR-014, FR-015 / US1-US2: hosted login and validated server session.
- FR-005 through FR-007, FR-010 / US1-US3: protected SSR shell, C01 gateway, and logout.
- FR-012, FR-013 / operator journey: redacted telemetry and distributed abuse policy integration.
- SC-001 to SC-005: healthy latency, denial, route protection, redaction, and accessibility orchestration.
