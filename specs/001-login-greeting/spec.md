# Feature Specification: Login and User Greeting

**Feature Branch**: `001-login-greeting`

**Created**: 2026-08-22

**Status**: Ready for planning

**Input**: User description: "Refer the markdown files in the folder shell-app-developer for the specifications"

**Specification basis**: This specification consolidates the approved requirements in `shell-app-developer/input/spec.md` and the related architecture, component, contract, data-model, and quickstart markdown files. Those documents define a Shell App host, the `login-greeting-web` micro-app, and Keycloak as the identity provider.

## Clarifications

### Session 2026-08-22

- Q: What failed-login abuse-control policy should the feature require? → A: Application-level rate limiting with fixed thresholds defined in the Shell App.
- Q: What fixed failed-login threshold should the Shell App enforce? → A: 5 attempts per 15 minutes.
- Q: How should the Shell App normalize usernames before displaying them? → A: Preserve provider value.
- Q: Which accessibility baseline should define acceptance for the login and greeting journeys? → A: WCAG 2.2 AA.
- Q: Should a user be allowed to maintain multiple authenticated sessions at the same time? → A: Allow multiple sessions per user.
- Q: Which browser baseline should define acceptance? → A: The latest two major versions of Chrome, Edge, Firefox, and Safari on supported desktop and mobile platforms, including iOS Safari.

## User Scenarios & Testing

### User Story 1 - Sign in and see a personalized greeting (Priority: P1)

As a registered user, I want to sign in with my username and password so that I can access a page that greets me by username.

**Why this priority**: Authentication and the personalized greeting are the complete primary value of the feature.

**Independent Test**: Use a valid registered account, complete the hosted sign-in flow, and verify that the protected greeting displays that account's username as text.

**Acceptance Scenarios**:

1. **Given** a visitor opens the application's login entry, **When** the visitor completes the Keycloak-hosted login with valid credentials, **Then** the Shell App validates the result, creates an authenticated session, and displays the protected greeting micro-app.
2. **Given** a user has an active authenticated session, **When** the user refreshes or revisits the greeting route, **Then** the Shell App permits access and the greeting still shows the authenticated user's username.

---

### User Story 2 - Recover safely from unsuccessful sign-in (Priority: P1)

As a person attempting to sign in, I want clear, non-sensitive feedback when my credentials are not accepted so that I can correct my input without being granted access.

**Why this priority**: Safe failure is essential to authentication and prevents unauthorized access or account enumeration.

**Independent Test**: Submit missing or invalid credentials through the hosted login page and verify that no application session or greeting is created and that generic feedback is provided.

**Acceptance Scenarios**:

1. **Given** the Keycloak-hosted login page is displayed, **When** the user submits an unknown username or incorrect password, **Then** authentication is denied with a generic error and the application remains unauthenticated.
2. **Given** one or both required credential fields are empty, **When** the user submits the form, **Then** the hosted login flow identifies the missing input and does not grant access.
3. **Given** Keycloak, the session store, or another required dependency is unavailable, **When** the user attempts to authenticate or access protected content, **Then** the application fails closed and shows a user-safe failure message.

---

### User Story 3 - Sign out and lose protected access (Priority: P2)

As an authenticated user, I want to sign out so that another person using the same device cannot access my greeting page.

**Why this priority**: Ending the application session protects the user's account after the primary journey is complete.

**Independent Test**: Sign in, select sign out, then revisit the protected greeting route and verify that authentication is required again.

**Acceptance Scenarios**:

1. **Given** an authenticated user is viewing the greeting, **When** the user selects sign out, **Then** the Shell App invalidates the local session, attempts provider logout, and returns the browser to the login entry.
2. **Given** the user has signed out, **When** the user opens the greeting route directly or uses browser history, **Then** the greeting is not revealed and the user must authenticate again.
3. **Given** provider logout reports an error, **When** local sign out has completed, **Then** protected access remains unavailable because local invalidation is immediate and authoritative for the application.

### Edge Cases

- The user submits whitespace-only or incomplete credentials; no application session is created.
- The username contains characters such as `<` or `&`; the greeting displays literal text and does not interpret markup or executable content.
- The user submits credentials repeatedly; abuse controls apply and no repeated submission bypasses authentication.
- The authenticated session expires, is revoked, or cannot be read; protected content is withheld and the user is returned to the login flow.
- The OIDC callback has invalid transaction or identity data; no session is created.
- A browser sends spoofed identity data or an arbitrary micro-app URL; the Shell App ignores untrusted identity claims and does not load unapproved locations.
- Telemetry delivery fails; authorization and user access decisions continue without waiting for telemetry.

## Requirements

### Functional Requirements

- **FR-001**: The application MUST provide a browser-facing login entry and redirect unauthenticated users to Keycloak's hosted login page.
- **FR-002**: Keycloak MUST collect and validate required username and password inputs; the Shell App MUST not receive, store, proxy, or validate passwords.
- **FR-003**: The Shell App MUST validate the OIDC authorization result before granting access.
- **FR-004**: The application MUST create an authenticated server-side session only after successful identity verification and MUST rotate the browser session reference after authentication.
- **FR-005**: Protected routes MUST be accessible only when the Shell App validates the current authenticated session; invalid or unreadable sessions MUST fail closed.
- **FR-006**: After successful authentication, the Shell App MUST display the approved `login-greeting-web` micro-app inside the authenticated shell.
- **FR-007**: The greeting MUST display the authenticated user's bounded username projection as escaped, user-visible text, preserving the validated provider value without case or whitespace normalization.
- **FR-008**: The Shell App MUST own application navigation and MUST load only registered, allow-listed micro-app entries.
- **FR-009**: Invalid credentials MUST be denied with generic feedback that does not reveal whether the username or password was incorrect.
- **FR-010**: The application MUST provide an explicit sign-out action that immediately invalidates the local session, attempts provider logout idempotently, and returns the browser to the login entry.
- **FR-011**: State-changing browser requests MUST be protected against cross-site request forgery and return paths MUST be same-origin and safe.
- **FR-012**: Authentication, session, route-denial, rate-limit, micro-app, dependency-failure, and sign-out events MUST be recorded as versioned, redacted events without passwords, tokens, codes, session contents, or raw provider responses.
- **FR-013**: The Shell App MUST apply application-level rate limiting of 5 failed attempts per 15 minutes and MUST deny or delay excess attempts without revealing account existence.
- **FR-014**: Keycloak MUST remain authoritative for user identity and credential verification; the application MUST NOT store passwords.
- **FR-015**: The application MUST use the configured provider session defaults for expiration, inactivity, renewal, and revocation behavior.
- **FR-016**: Authentication and protected-route failures MUST fail closed, while a greeting micro-app failure MUST be isolated from shell sign-out and navigation.
- **FR-017**: The login, shell, identity-provider, and micro-app interactions MUST use approved versioned contracts and document coordinated migration for breaking changes.
- **FR-018**: The login and greeting journeys MUST meet WCAG 2.2 AA acceptance expectations, including keyboard operation, associated labels, readable status and error feedback, predictable focus behavior, and supported desktop and mobile browsers.
- **FR-019**: The application MUST allow multiple independent authenticated sessions for the same user, with sign-out invalidating only the session used for that sign-out request.

### Key Entities

- **User Account**: A registered identity owned by Keycloak, including a stable identity and username; passwords are never exposed to the application.
- **Credential Submission**: Username and password entered on the hosted identity-provider page; not received, stored, or logged by the Shell App.
- **Authenticated Session**: A time-bounded server-owned proof associated with one user identity and invalidated on sign-out, expiration, revocation, or session-store failure.
- **OIDC Transaction**: A short-lived authentication transaction used to validate the login callback; invalid or expired transactions cannot create sessions.
- **Micro-App Manifest Entry**: An approved navigation and loading definition for a registered micro-app.
- **Greeting View Model**: A transient username projection used only to render the greeting.
- **Authentication Event**: A versioned, redacted record of authentication, session, route, dependency, abuse-control, micro-app, or sign-out outcomes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: At least 95% of healthy journeys using valid test accounts reach the personalized greeting within 2 seconds after provider authentication under normal network conditions.
- **SC-002**: 100% of invalid-credential test attempts are denied access and produce no application session or greeting content.
- **SC-003**: 100% of direct-navigation, refresh, expired-session, and post-sign-out attempts without a valid session are denied protected content.
- **SC-004**: 100% of inspected telemetry records contain no password, token, authorization code, raw provider response, or session-content value.
- **SC-005**: 100% of tested unapproved micro-app entries are denied without loading their locations, while tested micro-app failures leave shell sign-out usable.
- **SC-006**: The login and greeting journeys pass the agreed WCAG 2.2 AA accessibility checks, and at least 95% of representative keyboard-only test users can complete the login-to-greeting and sign-out journeys without a pointer device.

## Assumptions

- Users are pre-registered in Keycloak; registration, password recovery, profile editing, multi-factor authentication, social login, administrative user management, and role-based authorization beyond authenticated versus unauthenticated access are outside this feature.
- The first release targets web browsers on the supported current desktop and mobile browser baseline; native mobile applications are out of scope.
- The supported browser baseline is the latest two major versions of Chrome, Edge, Firefox, and Safari on supported desktop and mobile platforms, including iOS Safari.
- Shell App is the browser's only application endpoint and owns the server-side session, route protection, navigation, and micro-app hosting.
- A user may maintain multiple independent authenticated sessions across browsers or devices; signing out one session does not invalidate the others.
- `login-greeting-web` owns greeting presentation only and has no OIDC, credential, persistent-session, token, navigation, or route-protection responsibility.
- Keycloak, a TLS-capable shared session store, and an observability platform are available deployment dependencies; the Shell App owns the fixed failed-login limit of 5 attempts per 15 minutes.
- Username projections preserve the validated provider value, are limited to 128 Unicode characters, and are safe to display as text after context-safe rendering.
- Validation uses deterministic unit tests and narrow boundary contract checks defined by the approved handoff; no broad end-to-end test stage is required by the project constitution.
- The detailed design remains in the markdown files under `shell-app-developer/input/`; this specification states the user-facing scope and testable requirements.
