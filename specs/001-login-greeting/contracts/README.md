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

## Contract ownership and migration

The Shell App owns `BROWSER-BFF-001` and `SHELL-NAV-001`; the application/domain
layers own authentication, authorization, identity projection, and failure
outcomes; infrastructure owns only replaceable provider, Redis, security,
telemetry, and transport adapters. A micro-app owns presentation within
`BFF-UI-001` and never owns session or navigation decisions.

To make a breaking change: (1) record the reason and security impact, (2) add a
new contract version and keep the prior version readable during the migration,
(3) deploy consumers before producers, (4) migrate or expire stored session and
transaction records deliberately, (5) run focused contract/security checks, and
(6) remove the old version only after all consumers and instances have moved.
Cookie names, Redis keys, telemetry fields, claim mappings, and return-path
rules are security-sensitive changes and require explicit review; incompatible
changes fail closed rather than silently falling back.