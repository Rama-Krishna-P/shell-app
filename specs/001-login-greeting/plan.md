# Implementation Plan: Login and User Greeting

**Branch**: `001-login-greeting` | **Date**: 2026-08-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Deliver the Shell App as the browser-facing Angular SSR backend-for-frontend. It
redirects unauthenticated users to Keycloak, validates the OIDC callback, owns a
rotated server-side session in shared Redis, protects routes, and hosts the
allow-listed `login-greeting-web` micro-app. Authentication and failure policies
remain in inward-facing application/domain services with replaceable adapters for
OIDC, Redis, cookies, CSRF, micro-app transport, manifests, and telemetry.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x, Node.js 22 LTS, Angular SSR

**Primary Dependencies**: Angular CLI, `@angular/ssr`, maintained server-side OIDC library, `ioredis`

**Storage**: TLS-enabled shared Redis for authenticated sessions and five-minute OIDC transactions

**Testing**: Deterministic unit tests and narrow OIDC/BFF/UI/navigation contract checks; formatter/linter and production builds

**Target Platform**: HTTPS Node SSR service and the latest two major versions of Chrome, Edge, Firefox, and Safari on supported desktop/mobile platforms, including iOS Safari

**Project Type**: Web application/backend-for-frontend with hosted micro-app

**Performance Goals**: At least 95% of healthy valid journeys reach the greeting within 2 seconds after provider authentication

**Constraints**: Passwords and tokens stay outside the Shell App/browser boundary; protected failures fail closed; local logout is authoritative; micro-app failures are isolated; rate limit is 5 failed attempts per 15 minutes

**Scale/Scope**: Horizontally scalable Shell App using shared Redis; initial scope is one registered greeting micro-app and independent user sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

* **PASS** — Domain/application policies remain independent of Angular, HTTP, Redis,
  Keycloak, and micro-app infrastructure.
* **PASS** — External systems are accessed through inner-layer-owned interfaces and
  replaceable adapters.
* **PASS** — Each changed behavior will have deterministic focused unit coverage;
  broad integration/E2E stages are not added.
* **PASS** — Security decisions are centralized, and secrets, tokens, credentials,
  and session contents are excluded from source, fixtures, and telemetry.
* **PASS** — Versioned public/internal contracts and migration implications are
  documented in `contracts/`.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
.
├── angular.json
├── package.json
├── tsconfig.json
├── src/
│   ├── app/                 # SSR/browser composition and accessible shell UI
│   ├── server/              # HTTP routes, SSR handlers, boundary translation
│   ├── domain/               # inward-facing domain policies and types
│   ├── application/          # use cases and inner-layer ports
│   ├── infrastructure/       # OIDC, Redis, security, and telemetry adapters
│   ├── shell/                # authenticated shell and host actions
│   ├── navigation/           # manifest and route allow-list policy
│   ├── micro-apps/           # private BFF-UI-001 lifecycle/transport adapter
│   ├── security/             # CSRF, cookies, rate limiting, safe return paths
│   └── telemetry/            # redaction, versioned events, async delivery
├── public/
├── tests/unit/
├── tests/contracts/
└── deploy/config/
```

**Structure Decision**: Use the approved single Angular SSR application at the
repository root. Server-only authentication and session concerns are separate
from browser composition, while domain/application policies are isolated behind
interfaces. Deployment configuration is kept outside source code. The initial
`login-greeting-web` micro-app is an independently replaceable private component;
it is not duplicated into the Shell App.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No constitution violations identified. | N/A |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
