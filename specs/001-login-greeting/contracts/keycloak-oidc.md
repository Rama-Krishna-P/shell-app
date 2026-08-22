# OIDC-001 — Keycloak OpenID Connect Boundary

Keycloak is the credential and identity authority. The Shell App uses issuer
discovery and a confidential authorization-code client with PKCE. Passwords,
codes, tokens, and raw provider responses remain server-side.

The adapter validates issuer, client/audience binding, exact redirect URI, state,
nonce, PKCE verifier, signatures, expiry, and the required bounded
`preferred_username` claim. Transactions are single-use with a five-minute
maximum lifetime. Provider expiration, inactivity, renewal, and revocation
defaults remain authoritative. Callback or provider failures create no session;
credential submissions are never automatically retried.

Provider logout is idempotent and attempted after local invalidation. Its failure
cannot restore local protected access. Changes to issuer, client registration,
claim mapping, or session policy require coordinated versioned review.