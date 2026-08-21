# Contract: Keycloak OpenID Connect Boundary

**Contract ID**: `OIDC-001`  
**Provider**: Keycloak (`EXT01`)  
**Consumer**: Shell App (`C02`)
**Status**: Approved handoff

**Client profile**: Confidential server-side client using authorization code with PKCE. C02 uses issuer discovery and the `preferred_username` claim; the client secret and all tokens remain in the platform secret store or server-side session adapter.

## Purpose and Protocol

Define the server-side OIDC boundary used to authenticate a registered user, validate the resulting identity/session, and terminate the provider session. C02 is the OIDC client and keeps all transaction state and tokens server-side. Keycloak is authoritative for credentials, User Account identity, and provider session lifecycle.

- Protocol: OpenID Connect over HTTPS using authorization code with PKCE where supported.
- Discovery: C02 uses issuer discovery metadata; endpoints are not independently hardcoded.
- Client registration: client type, redirect URI, post-logout redirect, allowed origins, claim mapping, and secret handling are coordinated configuration.
- Provider defaults: Keycloak expiration, inactivity, renewal, revocation, and abuse policy are authoritative.

## Operations

| Operation | Request | Success | Failure |
|---|---|---|---|
| Authorization | C02 redirect with client ID, redirect URI, response type, scope, state, nonce, and PKCE challenge | Keycloak hosts credential entry and returns a bound authorization response | Invalid credentials, cancellation, invalid request, or outage; no C02 session |
| Callback/token exchange | C02 sends single-use code with state and PKCE verifier | C02 validates response and obtains identity/provider session server-side | Any mismatch, expiry, malformed response, or exchange failure is rejected |
| Session validation | C02 validates provider session/token according to its server-side strategy | C02 retains or refreshes an active application session | Missing, expired, revoked, malformed, or unverifiable state; access denied |
| Logout | C02 sends provider logout with server-side session context and approved redirect | Provider session ends | C02 still invalidates local session; retry is user-initiated and idempotent |

## Security and Failure Rules

C02 validates issuer, client/audience binding, redirect URI, state, nonce, PKCE verifier, signature, and expiry using a maintained OIDC implementation. Passwords are entered only on Keycloak's HTTPS-hosted page. C02 never logs or forwards passwords, codes, access/refresh/ID tokens, raw responses, or session contents. Credential submission is never automatically retried. Provider failures have bounded timeouts and produce generic errors. At most one bounded retry may be used for transient metadata/session reads. Any validation failure fails closed.

The callback transaction is single-use and expires after five minutes. The username claim is required, bounded to 128 Unicode characters, and rejected when absent or invalid. Provider session expiration, inactivity, renewal, and revocation remain Keycloak defaults; C02 never extends them locally.

## Compatibility and Tests

Changes to issuer, client registration, claim mapping, flow, or session policy require coordinated configuration review. Standard discovery and claims are preferred. Unit tests cover request construction and validation failures; a narrow contract test against configured Keycloak discovery/callback/logout behavior is justified when available.
