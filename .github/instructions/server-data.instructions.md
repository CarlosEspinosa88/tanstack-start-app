---
applyTo: "src/server/**/*.ts"
---

# Server-side data and authorization rules

- Treat every server function and request handler as a public trust boundary, even when invoked by the application's own UI.
- Reuse the existing authentication flow (`getUserFromRequest` / `requireRequestUser`) and validate every caller-controlled input with the matching Zod schema.
- Scope personal Todo reads and writes by the authenticated user's `userId`; shared-board writes must include the board owner's `userId` and accepted editor-share condition in the repository query. Bulk operations must validate bounded, unique ID arrays.
- For board viewing, call the existing share-access logic and require an `ACCEPTED` share for a viewer other than the owner. Only an accepted `EDITOR` share grants write permission; include that permission condition in mutation queries themselves.
- Invitation actions must remain scoped to the recipient and pending state; revoke actions must remain scoped to the owner and accepted state.
- Keep domain operations separate from Prisma adapters when that pattern is already used. Prefer adding behavior to `todo-operations.ts` / `board-sharing.ts` and repository interfaces/adapters rather than embedding all logic in a route handler.
- Preserve transaction boundaries and handle concurrency/unique constraints explicitly when changing multi-step writes.
- Never trust IDs supplied by the browser as proof of ownership. Never return secrets, token claims that are not needed, raw database errors, or stack traces.
- Avoid logging bearer tokens, cookies, OAuth codes, JWTs, email payloads, or other personal data.
- Do not weaken OAuth state checks, Google verified-email validation, JWT algorithm verification, or HTTP-only/SameSite/Secure cookie settings.
