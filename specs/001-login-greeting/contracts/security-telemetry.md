# TELEMETRY-001 — Redacted Security Telemetry

**Version:** v1. Events are asynchronous or buffered and never decide access.

Events contain allow-listed `eventName`, `eventVersion`, `outcome`, timestamp,
correlation ID, route, component, provider category, and bounded status/latency
metadata. Outcomes include success, invalid-credentials, dependency-failure,
validation-failure, rate-limited, route-denied, micro-app-load-failure, and
terminated. A minimized subject identifier is allowed only after successful
authentication.

Passwords, credentials, usernames from failed attempts, tokens, authorization
codes, PKCE verifiers, raw provider responses, session contents, sensitive query
strings, and entry URLs are forbidden. Delivery failures may drop/buffer events
but must never affect authorization or cause verbose fallback logging.