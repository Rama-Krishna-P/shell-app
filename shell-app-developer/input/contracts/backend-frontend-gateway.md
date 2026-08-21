# Contract: Shell App to Greeting Micro-App

**Contract ID**: `BFF-UI-001`  
**Provider**: Shell App (`C02`)  
**Consumer**: login-greeting-web micro-app (`C01`)  
**Version**: `v1`  
**Mode**: Synchronous micro-app mount/load or equivalent private invocation

## Request and Identity Context

Shell App loads C01 only after authorizing an active server session and resolving an allow-listed micro-app manifest entry. Before loading, it removes inbound identity headers and injects a server-derived, bounded identity projection according to the deployment's trusted transport policy. The projection includes the stable subject reference only when required and the configured username claim for the greeting. C01 must not use this context as authorization outside the trusted Shell App boundary.

The version `v1` projection is:

```json
{
    "subject": "provider-subject",
    "username": "bounded-preferred-username",
    "contractVersion": "v1"
}
```

`subject` and `username` are required strings; `username` is limited to 128 Unicode characters. The projection is sent only over the private authenticated C02-to-C01 connection. C01 rejects requests without valid C02 service authentication and never accepts browser-supplied copies of these fields.

## Response and Failure

C01 returns the greeting view or safe micro-app response. Shell App preserves correlation metadata, bounds response size, and prevents micro-app error details from reaching the browser. A C01 timeout, malformed mount response, or failure returns a generic unavailable state; Shell App never retries an operation in a way that could duplicate a state change or bypass authorization. A 401/403 from C01 invalidates or rechecks the Shell App session and reveals no greeting.

## Security and Compatibility

The connection or mount context is private or mutually authenticated according to platform policy. C01 accepts traffic only from Shell App. Contract changes are additive where possible; identity claim mapping, lifecycle, entry-location, and trusted-context changes require coordinated deployment and security review.
