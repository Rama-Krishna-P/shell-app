# C02 Contract Bundle

C02 provides:

- [BROWSER-BFF-001 v1](../../../contracts/browser-backend-gateway.md) to the browser: routes, opaque cookie, CSRF, generic failures, and redirect behavior.
- [BFF-UI-001 v1](../../../contracts/backend-frontend-gateway.md) to C01: private trusted identity projection, bounded response, timeout, and failure isolation.
- [SHELL-NAV-001 v1](../../../contracts/micro-app-navigation.md) to browser/micro-apps: manifest allow-list and lifecycle ownership.
- [TELEMETRY-001 v1](../../../contracts/security-telemetry.md) to observability: redacted asynchronous events.

C02 consumes [OIDC-001](../../../contracts/keycloak-oidc.md) from EXT01. All contracts require bounded timeouts, explicit failure behavior, and versioned security review for trust-boundary changes.
