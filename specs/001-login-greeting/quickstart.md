# Quickstart and Validation

## Prerequisites

- Node.js 22 LTS, npm, and an Angular CLI compatible with the pinned workspace.
- Configured Keycloak realm and confidential authorization-code client with PKCE,
  exact HTTPS callback/logout URIs, issuer discovery, and `preferred_username`.
- Registered valid and invalid test accounts.
- TLS-capable shared Redis and private `login-greeting-web` entry.

## Configuration

Configure non-secret values for issuer URL, client ID, callback/logout URIs,
Redis URL, private greeting entry, cookie name, transaction TTL, username limit,
return-path policy, and telemetry sink. Keep client secrets, passwords, tokens,
authorization codes, and refresh tokens in the platform secret store.

## Validation commands

From the implementation root, run `npm ci`, `npm run lint`, `npm test`, and the
SSR production build. Run the corresponding lint, unit tests, and production
build for the independently deployed greeting micro-app. The constitution does
not require a broad E2E stage.

## Required scenarios

1. Valid Keycloak login creates a rotated session and displays the bounded
   username as literal text.
2. Missing/invalid credentials produce generic failure, no session, and no
   greeting; five failed attempts in 15 minutes trigger application rate limiting.
3. Direct, refreshed, expired, revoked, or unreadable protected routes fail closed.
4. CSRF-protected sign-out invalidates only the current session, clears its cookie,
   attempts provider logout, and remains safe if provider logout fails.
5. Unknown manifest entries and arbitrary entry URLs are rejected without loading.
6. Greeting timeout/malformed response shows a safe unavailable state while shell
   navigation and sign-out remain usable.
7. `<` and `&` in a validated username render as text, never markup.
8. Keyboard-only login, error, focus, status, and sign-out journeys meet WCAG
   2.2 AA expectations on supported desktop and mobile browsers.
9. Inspect telemetry and confirm no passwords, tokens, codes, raw provider
   responses, session contents, or failed-attempt usernames are present.

See [`data-model.md`](data-model.md) and [`contracts/README.md`](contracts/README.md)
for ownership and boundary details.