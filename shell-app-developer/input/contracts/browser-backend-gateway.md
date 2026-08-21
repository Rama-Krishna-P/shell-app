# Contract: Browser to Shell App

**Contract ID**: `BROWSER-BFF-001`  
**Provider**: Shell App (`C02`)  
**Consumer**: Browser user  
**Version**: `v1`

## Routes and Behavior

| Route | Method | Behavior | Success | Failure |
|---|---|---|---|---|
| Application entry/protected route | GET | Read the opaque session cookie and authorize | Serves or proxies C01 | 302 to Keycloak when unauthenticated; safe error when dependency fails |
| OIDC callback | GET | Consume single-use code/state and validate through C02 | Rotates session cookie and redirects to allow-listed return path | Rejects mismatch/expiry/malformed data; no session; generic login error |
| Sign-out | POST | CSRF-protected local invalidation followed by provider logout | Clears cookie and redirects to login | Local invalidation still succeeds if provider logout fails |

The browser never sends credentials to C02 and never receives tokens, authorization codes beyond the callback handling, or identity claims from an untrusted source. The login form is Keycloak-hosted.

## Request and Response Schema

- `GET /`: no request body; unauthenticated requests receive `302 Location: <Keycloak authorization URL>` and authenticated requests receive the protected C01 response.
- `GET /auth/callback`: accepts only the provider `code` and `state` query parameters; both are single-use and are never echoed in a response or log.
- `POST /logout`: requires the C02 session cookie and CSRF token; the response is `303 Location: /login` with an expired session cookie.
- Generic failures use an HTML or JSON-safe user message with no provider detail, username enumeration, token, or session content.

## Session and Security

The session cookie is Secure, HttpOnly, SameSite-appropriate, scoped to the application origin, and rotated after authentication. C02 validates a strict allow-list for return paths. State-changing routes require CSRF protection. C02 must not accept browser-supplied identity headers or authorization decisions.

## Errors and Compatibility

Responses use generic user-safe messages and do not reveal account existence, tokens, provider responses, or session details. Protected access is fail closed. Additive response metadata is compatible; changing cookie, callback, route, or CSRF semantics requires a versioned review. Return paths are same-origin paths beginning with `/`; absolute and scheme-relative values are rejected.
