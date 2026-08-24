---
description: "Implementation tasks for Login and User Greeting"
---

# Tasks: Login and User Greeting

**Input**: Design documents from `specs/001-login-greeting/`

**Tech stack**: TypeScript 5.x, Node.js 22 LTS, Angular SSR, maintained server-side OIDC library, `ioredis`

**Testing policy**: Focused deterministic unit tests and narrow contract checks only; no broad E2E stage is required by the constitution.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Angular SSR application and repository quality tooling.

- [X] T001 Create the Angular SSR project structure at the repository root with `src/`, `public/`, `tests/unit/`, and `deploy/config/` directories
- [X] T002 Initialize `package.json` with Angular SSR, Node.js 22, TypeScript 5.x, OIDC, Redis, lint, formatting, and unit-test dependencies
- [X] T003 [P] Configure `angular.json`, `tsconfig.json`, and SSR build targets
- [X] T004 [P] Configure `.eslintrc` and `.prettierrc` with the repository quality gate
- [X] T005 [P] Add non-secret runtime configuration schema and example values in `deploy/config/` without credentials, tokens, or passwords

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build inward-facing policies and replaceable boundary interfaces before user-story implementation.

- [X] T006 Define shared domain result types, bounded username projection, safe return-path value object, and failure outcomes in `src/domain/`
- [X] T007 [P] Define OIDC, session, transaction, CSRF, rate-limit, manifest, micro-app, and telemetry ports owned by inner layers in `src/application/ports/`
- [X] T008 [P] Implement environment/configuration parsing and fail-closed validation in `src/infrastructure/config/`
- [X] T009 [P] Implement Redis connection and TTL-backed session/transaction repository adapters in `src/infrastructure/session/`
- [X] T010 [P] Implement secure cookie, CSRF-token, and safe same-origin return-path adapters in `src/infrastructure/security/`
- [X] T011 [P] Implement versioned redacted asynchronous telemetry adapter and allow-listed event schema in `src/infrastructure/telemetry/`
- [X] T012 [P] Implement centralized HTTP error translation, correlation IDs, and fail-closed middleware in `src/server/middleware/`
- [X] T013 Document the versioned contract ownership and breaking-change migration procedure in `specs/001-login-greeting/contracts/README.md`

**Checkpoint**: The Angular SSR shell has validated configuration, replaceable adapters, secure boundary primitives, and a fail-closed server composition root.

---

## Phase 3: User Story 1 - Sign in and see a personalized greeting (Priority: P1) 🎯 MVP

**Goal**: Complete hosted Keycloak login, validate the OIDC callback, create a rotated server session, and render the approved greeting micro-app with the bounded provider username.

**Independent Test**: With a valid Keycloak test account, open the login entry, complete hosted login, refresh the greeting route, and verify the literal authenticated username remains visible without browser-held tokens.

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement `UserAccount`, `AuthenticatedSession`, and `OidcTransaction` domain types and state transitions in `src/domain/auth/`
- [X] T015 [P] [US1] Implement the Keycloak authorization-code PKCE adapter with issuer, client, redirect, state, nonce, signature, expiry, claim, and single-use transaction validation in `src/infrastructure/oidc/`
- [X] T016 [US1] Implement login-entry and OIDC callback use cases, including callback failure handling and browser session-reference rotation, in `src/application/auth/`
- [X] T017 [US1] Add `/`, `/login`, and `/auth/callback` SSR route handlers that redirect unauthenticated users to Keycloak and redirect successful callbacks only to safe same-origin paths in `src/server/routes/auth.routes.ts`
- [X] T018 [P] [US1] Implement `MicroAppManifestEntry` and allow-listed `login-greeting-web` manifest configuration in `src/navigation/`
- [X] T019 [P] [US1] Implement `GreetingViewModel` mapping with 128-Unicode-character bounded username preservation and escaped text rendering in `src/micro-apps/greeting/`
- [X] T020 [US1] Implement authenticated shell composition and BFF-UI-001 mount boundary for `login-greeting-web` in `src/shell/`
- [X] T021 [US1] Add accessible Angular SSR login/shell/greeting views with labels, status regions, predictable focus, keyboard operation, and WCAG 2.2 AA semantics in `src/app/`
- [X] T022 [US1] Add focused deterministic unit tests for OIDC validation, transaction consumption, session rotation, username bounds/escaping, and authenticated greeting projection in `tests/unit/us1-login-greeting/`
- [X] T023 [X] [US1] Add narrow contract checks for OIDC-001, BROWSER-BFF-001, BFF-UI-001, and SHELL-NAV-001 in `tests/contracts/us1-login-greeting/`

**Checkpoint**: User Story 1 is independently functional: valid authentication reaches the greeting, refresh preserves access, and username content is rendered safely.

---

## Phase 4: User Story 2 - Recover safely from unsuccessful sign-in (Priority: P1)

**Goal**: Deny invalid or incomplete authentication generically, apply the five-attempts-per-fifteen-minutes abuse control, and fail closed when dependencies or callback data are invalid.

**Independent Test**: Submit invalid/missing credentials, exhaust the configured failed-attempt threshold, and simulate unavailable Keycloak, Redis, or invalid OIDC state; verify no session or greeting is created and only safe generic feedback is returned.

### Implementation for User Story 2

- [X] T024 [P] [US2] Implement fixed-threshold failed-login rate-limit policy of 5 attempts per 15 minutes without logging failed-attempt usernames in `src/application/security/login-rate-limit.policy.ts`
- [X] T025 [P] [US2] Implement generic authentication/dependency failure contracts and fail-closed authorization decisions in `src/application/auth/failure-policy.ts`
- [X] T026 [US2] Integrate rate-limit checks, generic error mapping, and dependency-failure handling into login and callback routes in `src/server/routes/auth.routes.ts`
- [X] T027 [US2] Add protected-route session validation that denies unreadable, expired, revoked, or spoofed sessions in `src/server/middleware/require-session.ts`
- [X] T028 [US2] Add safe accessible error, status, focus, and retry messaging to the hosted-login return and shell views in `src/app/`
- [X] T029 [US2] Add focused deterministic unit tests for invalid credentials, empty/whitespace inputs, rate limiting, invalid transactions, dependency failures, and fail-closed route decisions in `tests/unit/us2-safe-login-failure/`
- [X] T030 [US2] Add narrow contract checks for generic BROWSER-BFF-001 failures and TELEMETRY-001 failure outcomes in `tests/contracts/us2-safe-login-failure/`

**Checkpoint**: User Story 2 is independently testable: no unsuccessful or failed-closed path creates protected access, leaks account existence, or bypasses the threshold.

---

## Phase 5: User Story 3 - Sign out and lose protected access (Priority: P2)

**Goal**: Invalidate only the current server session, clear its cookie, attempt provider logout idempotently, and prevent protected access through direct navigation or browser history.

**Independent Test**: Sign in, submit CSRF-protected sign-out, verify redirect to login and denial of the protected route, then simulate provider logout failure and confirm local protection remains authoritative; verify another session remains valid.

### Implementation for User Story 3

- [ ] T031 [P] [US3] Implement local session invalidation, cookie clearing, and provider-logout orchestration with idempotent failure handling in `src/application/auth/logout.use-case.ts`
- [ ] T032 [US3] Add CSRF-protected `POST /logout` route with local invalidation before provider logout and redirect to `/login` in `src/server/routes/logout.routes.ts`
- [ ] T033 [US3] Add cache/history protection headers and post-logout protected-route enforcement in `src/server/middleware/require-session.ts`
- [ ] T034 [US3] Add accessible sign-out action, focus behavior, and safe provider-logout failure status in `src/app/`
- [ ] T035 [US3] Add focused deterministic unit tests for CSRF enforcement, local-first invalidation, idempotent provider failure, direct navigation denial, and independent multi-session behavior in `tests/unit/us3-logout/`
- [ ] T036 [US3] Add narrow contract checks for logout, cookie, CSRF, and provider-failure behavior in `tests/contracts/us3-logout/`

**Checkpoint**: User Story 3 is independently testable: sign-out removes only the current session's access and remains safe when provider logout is unavailable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate security, accessibility, performance, operability, and documentation across the completed stories.

- [ ] T037 [P] Add focused unit coverage for telemetry redaction, allow-listed event names, async delivery failure, and forbidden sensitive fields in `tests/unit/telemetry/`
- [ ] T038 [P] Add focused unit coverage for unknown manifest entries, arbitrary URLs, micro-app timeout/malformed response isolation, and shell lifecycle recovery in `tests/unit/micro-app-navigation/`
- [ ] T039 [P] Add production deployment configuration, secret-store references, TLS requirements, Redis TTL settings, and horizontal-scaling notes in `deploy/config/`
- [ ] T040 [P] Add WCAG 2.2 AA keyboard and accessibility acceptance checks for login, greeting, errors, status, focus, and sign-out in `tests/unit/accessibility/`
- [ ] T041 Run formatter, linter, deterministic unit tests, narrow contract checks, and Angular SSR production builds from the repository root
- [ ] T042 Run the scenarios and validation commands in `specs/001-login-greeting/quickstart.md` and record any contract or configuration deviations in `specs/001-login-greeting/validation-results.md`
- [ ] T043 [P] Update `README.md` with architecture boundaries, local configuration, security constraints, run commands, and versioned contract migration guidance
- [ ] T044 Add focused unit coverage for configured provider expiration, inactivity, renewal, and revocation defaults in `tests/unit/auth/provider-session-defaults.test.ts`
- [ ] T045 Add focused unit coverage for every required telemetry category: authentication, session, route-denial, rate-limit, micro-app, dependency-failure, and sign-out events in `tests/unit/telemetry/event-coverage.test.ts`
- [ ] T046 Add deterministic performance validation for SC-001, measuring valid login-to-greeting completion against the 2-second target in `tests/unit/performance/login-greeting-performance.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no prerequisites and can begin immediately.
- Foundational (Phase 2) depends on Setup and blocks all user stories.
- User Stories 1 and 2 both depend on Phase 2 and are independently implementable; both are P1, so prioritize US1 for MVP while US2 can proceed in parallel.
- User Story 3 depends on Phase 2 and integrates the session primitives from US1/US2, but its behavior remains independently testable.
- Polish (Phase 6) depends on the stories selected for delivery.

### User Story Dependencies

- US1 (P1): Phase 2 only; MVP increment.
- US2 (P1): Phase 2 only; shares route composition and session policy with US1 but must be tested independently.
- US3 (P2): Phase 2 plus the session and CSRF ports; can be developed in parallel after those ports exist.

### Parallel Execution Examples

- Phase 1: T003, T004, and T005 can run in parallel after T001/T002 establish the project files.
- Phase 2: T007 through T012 can run in parallel once the project skeleton exists; T013 follows contract ownership review.
- US1: T014, T015, T018, and T019 can run in parallel; T016/T017 follow OIDC ports and T020/T021 follow the authenticated shell composition.
- US2: T024, T025, and T028 can run in parallel; T026/T027 follow the shared route/middleware boundaries.
- US3: T031 and T034 can run in parallel; T032/T033 follow the logout use case and session middleware.
- Polish: T037 through T040 and T043 can run in parallel before T041/T042.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and the blocking Phase 2 foundation.
2. Complete US1 through T023.
3. Validate the valid login-to-greeting journey independently.
4. Stop for MVP demo/deployment review before adding failure and logout increments.

### Incremental Delivery

1. Add US2 to harden unsuccessful authentication and fail-closed behavior.
2. Add US3 to complete local-first sign-out and session isolation.
3. Complete Phase 6 cross-cutting validation and deployment readiness.

### Format Validation

All 46 implementation tasks use the required `- [ ]` checkbox, sequential task IDs, optional `[P]` marker only for parallelizable work, required `[US#]` labels in story phases, and an explicit repository-relative file path in every description.