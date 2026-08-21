# Component Quickstart: EXT01 Keycloak

## Prerequisites

A reachable HTTPS Keycloak realm, confidential client, exact callback/logout URIs, `preferred_username` claim, provider-default session settings, rate-limit/edge policy, and valid/invalid test accounts.

## Focused Scenarios

1. Verify issuer discovery and authorization request contains client binding, state, nonce, and PKCE challenge.
2. Complete valid hosted login and verify the callback can be exchanged only once and returns the configured username claim.
3. Submit invalid credentials and verify generic provider feedback, no application session, and no password in provider/application telemetry.
4. Verify cancellation, expired/mismatched state, missing claim, provider expiry/revocation, and logout behavior.
5. Verify failed-login throttling and provider audit export are enabled under the approved operational policy.

Expected outcome: the configured narrow `OIDC-001` contract checks pass; provider defaults and operational retention are recorded without copying credentials into application configuration.

Consumer view: [C02 OIDC contract](../shell-app/contracts/README.md).
