# Contracts

The Shell App exposes and consumes these versioned boundaries:

- [`browser-backend-gateway.md`](browser-backend-gateway.md) — `BROWSER-BFF-001`,
  browser routes, cookies, CSRF, and generic failures.
- [`keycloak-oidc.md`](keycloak-oidc.md) — `OIDC-001`, hosted login, callback,
  validation, and provider logout.
- [`backend-frontend-gateway.md`](backend-frontend-gateway.md) — `BFF-UI-001`,
  trusted bounded greeting projection and failure isolation.
- [`micro-app-navigation.md`](micro-app-navigation.md) — `SHELL-NAV-001`,
  manifest, route ownership, lifecycle, and allow-list behavior.
- [`security-telemetry.md`](security-telemetry.md) — `TELEMETRY-001`, redacted
  asynchronous event schema and delivery behavior.

Breaking changes to route ownership, cookie/session schema, claim mapping,
identity projection, lifecycle, or redaction rules require versioned coordinated
rollout and security review.