---
name: auth-session-security
description: Security procedure for changing Google OAuth, OAuth state cookies, JWT sessions, request authentication, or user identity in this application.
---

# Authentication and session security procedure

## Existing model to preserve

- Google OAuth is integrated through `google-auth-library` in `src/server/auth.ts`.
- The callback verifies the ID token audience and requires a verified email and subject before upserting the user.
- Session JWT claims currently include `userId` and `email`; verification restricts the algorithm to HS256 and validates required claim types.
- Session cookies are HTTP-only, SameSite=Lax, path=/, seven days; Secure depends on environment.
- OAuth state cookies are HTTP-only, SameSite=Lax, scoped to the callback path, with a ten-minute lifetime.
- Request identity can be read from the session cookie or supported Bearer authorization header.

## Change checklist

1. Trace the full flow: authorization URL -> state creation/cookie -> callback -> state verification -> Google code exchange -> ID token verification -> user lookup/upsert -> session signing -> cookie setting -> authenticated server request -> logout.
2. Preserve state binding and one-time/expiry behavior. Never accept an OAuth callback based only on a supplied authorization code.
3. Validate issuer/audience/signature using the Google library; require verified email where the product requires it.
4. Keep `JWT_SECRET` server-only and fail safely when missing. Do not log tokens, codes, cookies, secrets, or complete identity payloads.
5. Preserve algorithm allowlisting and token expiry. Do not trust user identity or role values supplied by a client.
6. Enforce authorization on each server function/resource; session authentication alone does not imply access to every user's data.
7. Preserve cookie path, HttpOnly, SameSite, Secure, Max-Age and clearing semantics unless a security-reviewed requirement changes them.
8. Add tests for missing/invalid/expired state, invalid ID token, unverified email, missing secret, malformed/expired JWT, missing user, cookie attributes, and logout behavior as appropriate.
9. Document account-linking and email-uniqueness implications when changing the upsert strategy.

Never expose credentials in examples. Use placeholders and environment-variable names only.
