# Contract: Shell App Micro-App Navigation

**Contract ID**: `SHELL-NAV-001`  
**Provider**: Shell App (`C02`)  
**Consumer**: Authenticated browser user and registered micro-apps  
**Version**: `v1`  
**Mode**: Synchronous navigation with bounded micro-app loading

## Purpose

Define how Shell App exposes navigation and loads `login-greeting-web` and future micro-apps inside the authenticated shell. Shell App is the sole owner of navigation, manifest policy, route selection, and micro-app lifecycle.

## Manifest

The versioned manifest is an allow-list owned by Shell App. Each entry contains:

- `appId`: stable application identifier.
- `route`: same-origin application route owned by Shell App.
- `label` and optional display metadata for navigation.
- `entryLocation`: approved module or asset location; arbitrary browser-provided URLs are rejected.
- `contractVersion`: micro-app lifecycle and identity-context contract version.
- `healthPolicy`: bounded load timeout and safe unavailable behavior.

The initial entry is `login-greeting-web`. Future micro-apps must be registered, security-reviewed, and deployed before appearing in the manifest. A manifest entry does not grant access by itself; Shell App validates the active session and any applicable authorization policy before loading it.

## Lifecycle and Identity

Shell App resolves a route, validates the manifest entry, creates the micro-app mount context, and provides the request-scoped identity projection defined by [backend-frontend-gateway.md](backend-frontend-gateway.md). The initial C01 implementation uses an Angular standalone component exposed through a host lifecycle adapter with `mount`, `unmount`, and `onHostError` callbacks. Micro-apps may render content and request host actions such as sign-out. The sign-out host action invokes C02's same-origin, CSRF-protected `POST /logout` flow; micro-apps never call Keycloak directly. Micro-apps may not replace the shell, mutate the manifest, or navigate directly to an unregistered micro-app.

Shell App strips browser-supplied identity values and loads only approved entry locations. Micro-apps must support mount, unmount, and host-error callbacks. The shell must be able to unmount a failed micro-app without invalidating the authenticated session.

## Navigation and Failure Behavior

Unknown, malformed, unauthenticated, or unauthorized routes are denied. A missing or unhealthy entry produces a generic unavailable state within the shell and emits redacted telemetry. A bounded load retry may be used only for a clearly transient asset/manifest read; it must not repeat a state-changing operation. The browser never receives provider tokens or session contents.

## Compatibility

New optional manifest fields and additive lifecycle hooks are compatible. Changing route ownership, entry-location rules, identity projection, or lifecycle semantics requires a versioned contract review. Future micro-apps must not require changes to Shell App's OIDC or session ownership.
