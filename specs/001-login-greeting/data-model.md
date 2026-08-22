# Data Model: Login and User Greeting

## User Account

Owned by Keycloak. The Shell App consumes only a validated stable subject and the
configured `preferred_username` projection; it never stores passwords.

## AuthenticatedSession

Server-owned aggregate keyed by an opaque browser session reference. Fields are
the validated provider subject, bounded username (maximum 128 Unicode characters),
server-only provider session reference, timestamps, provider-derived expiry, and
active/invalidated status. It is stored with Redis TTL and is invalidated by
logout, expiry, revocation, or unreadable session-store state. Multiple sessions
per user are independent.

## OidcTransaction

Single-use state-keyed transaction containing server-side state, nonce, PKCE
verifier, return path, and creation/expiry metadata. It expires within five
minutes and is atomically consumed on callback success or failure. Sensitive
values are never logged.

## MicroAppManifestEntry

Versioned allow-list entry containing `appId`, Shell-owned route, label,
approved entry location, contract version, and bounded health/load policy. An
entry authorizes loading only after the active session is validated.

## GreetingViewModel

Transient projection containing `subject`, bounded `username`, and
`contractVersion: "v1"`. The micro-app renders `username` as escaped text and
cannot use it as independent authorization.

## AuthenticationEvent

Versioned, redacted asynchronous event containing allow-listed event name/version,
outcome, timestamp, correlation ID, route/component/provider category, and bounded
latency/status metadata. Passwords, tokens, codes, PKCE verifiers, raw provider
responses, session contents, and failed-attempt usernames are forbidden.

## State transitions

`OidcTransaction`: created → consumed or expired.

`AuthenticatedSession`: created → active → invalidated, with expiry/revocation
also transitioning active sessions to invalidated. Any unreadable store state is
treated as unauthorized rather than reconstructed.