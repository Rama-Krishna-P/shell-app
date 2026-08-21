# Component Data Model: C02 Shell App

C02 owns these models:

| Model | Kind and consistency | Lifecycle/retention | Migration |
|---|---|---|---|
| `AuthenticatedSession` | Aggregate rooted at opaque session ID; immediate authorization read | Active until provider-derived expiry, logout, revocation, or store failure; Redis TTL | Versioned compatible reads or planned invalidation |
| `OidcTransaction` | Single-use transient value keyed by state; atomic consume | Five-minute maximum TTL; discard on any callback outcome | N/A; expired records discarded |
| `MicroAppManifest` | Versioned configuration allow-list; immediate route decision | Deployment/registry policy retention | Coordinated manifest and contract version rollout |
| `AuthenticationEvent` | Redacted integration event; eventual sink visibility | Observability retention policy | Additive schema changes; required/redaction changes versioned |

`AuthenticatedSession` includes validated provider subject, bounded `preferred_username`, server-only provider reference, timestamps, expiry, and active/invalidated status. Only validated callbacks create active sessions; session-store loss denies access. C02 never owns Keycloak accounts, credentials, or provider audit records.
