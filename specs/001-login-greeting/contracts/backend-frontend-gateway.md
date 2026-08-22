# BFF-UI-001 — Shell App to Greeting Micro-App

**Version:** v1. The Shell App loads the micro-app only after validating the
server session and resolving an allow-listed manifest entry.

The private authenticated projection is:

```json
{"subject":"provider-subject","username":"bounded-preferred-username","contractVersion":"v1"}
```

Both strings are required and `username` is limited to 128 Unicode characters.
Inbound browser identity headers are stripped; the micro-app accepts only
Shell-authenticated traffic and cannot independently authorize users.

Timeouts, malformed responses, and micro-app failures produce a generic
unavailable state without exposing provider details or invalidating shell logout
and navigation. Contract, identity mapping, transport, and lifecycle changes
require coordinated rollout.