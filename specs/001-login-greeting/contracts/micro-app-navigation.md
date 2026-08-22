# SHELL-NAV-001 — Micro-App Navigation

**Version:** v1. The Shell App owns route selection, manifest policy, and the
micro-app lifecycle.

Each manifest entry has `appId`, Shell-owned same-origin `route`, label,
approved `entryLocation`, `contractVersion`, and bounded health/load policy.
`login-greeting-web` is the initial entry. Browser-provided module URLs, unknown
routes, and unregistered entries are rejected without loading.

The host provides mount, unmount, and host-error lifecycle operations. A
micro-app may request same-origin host sign-out, but never calls Keycloak,
replaces the shell, or mutates the manifest. A bounded transient load retry may
not repeat state-changing operations. Load failures remain isolated.