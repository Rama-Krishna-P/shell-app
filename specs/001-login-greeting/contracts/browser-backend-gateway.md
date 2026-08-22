# BROWSER-BFF-001 — Browser to Shell App

**Version:** v1. The Shell App is the browser's only application origin.

| Route | Method | Contract |
|---|---|---|
| `/` and protected routes | GET | Read opaque session; serve shell/micro-app or redirect unauthenticated users to Keycloak. |
| `/auth/callback` | GET | Accept single-use `code` and `state`; validate through OIDC; rotate session cookie and redirect only to a safe same-origin path. |
| `/logout` | POST | Require CSRF protection; invalidate the local session first, clear its cookie, attempt provider logout, and redirect to `/login`. |

The browser never sends credentials to the Shell App and never receives tokens or
trusted identity claims. Cookies are Secure, HttpOnly, application-scoped, and
SameSite-compatible with the callback. Absolute, scheme-relative, and unsafe
return paths are rejected. Failures are generic and protected access fails closed.