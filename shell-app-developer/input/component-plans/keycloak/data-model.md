# Component Data Model: EXT01 Keycloak

Keycloak owns persistent and provider-managed identity data:

| Model | Ownership and invariants | Retention/migration |
|---|---|---|
| `UserAccount` | Provider identity and `preferred_username`; credentials never leave Keycloak | Keycloak realm policy; external migration |
| Credentials | Provider secret material; verified only by Keycloak | Keycloak security policy; never copied |
| Provider session/tokens | Provider lifecycle, expiry, inactivity, renewal, and revocation | Keycloak defaults and token policy |
| Provider audit records | Provider-owned authentication/session events | Provider export and retention policy |

C02 maps only a validated subject and bounded username into its own session. No distributed transaction or shared persistence exists. Application schema migration is N/A; realm/client migration requires coordinated operational change.
