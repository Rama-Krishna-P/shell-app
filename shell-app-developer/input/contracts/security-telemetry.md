# Contract: Redacted Security Telemetry

**Contract ID**: `TELEMETRY-001`  
**Provider**: Shell App (`C02`)
**Consumer**: Observability platform  
**Version**: `v1`  
**Mode**: Asynchronous/buffered

## Schema

Each event contains `eventName`, `eventVersion`, `outcome`, `occurredAt`, `correlationId`, `route`, `component`, `providerCategory`, and bounded latency/status metadata where applicable. Outcomes include `success`, `invalid-credentials`, `dependency-failure`, `validation-failure`, `rate-limited`, `route-denied`, `micro-app-load-failure`, and `terminated`. A minimized subject identifier is allowed only after successful authentication. Micro-app events may include an allow-listed `appId` and manifest `contractVersion`, but never an entry URL or token.

## Validation and Security

Event names and categories are allow-listed. Passwords, access/refresh/ID tokens, authorization codes, PKCE verifiers, raw provider responses, session contents, credentials, and sensitive query strings are forbidden. Failed attempts must not emit usernames or account-existence signals.

## Failure and Delivery

Telemetry delivery must not determine whether access is granted, denied, or revoked. Bounded buffering and drop metrics are allowed; the emitter must never fall back to verbose secret-bearing logs. Events may arrive late or out of order; operators correlate using `occurredAt` and `correlationId`. Retention and access control belong to the observability platform.

## Compatibility

New optional fields are additive. Renaming outcomes, changing redaction rules, or changing required fields requires a versioned contract review.
