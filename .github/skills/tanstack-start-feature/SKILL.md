---
name: tanstack-start-feature
description: End-to-end procedure for adding a user-facing feature to this TanStack Start application, from file-based route and server function through domain logic, Prisma repository, UI, and tests.
---

# TanStack Start feature delivery

## 1. Map the existing flow

- Inspect the matching route in `src/routes/`, root/layout behavior, adjacent components, and current server functions.
- Inspect the corresponding module in `src/server/`: Zod validator, authentication helper, domain operation, Prisma repository, and tests.
- Inspect `prisma/schema.prisma` and migrations only if the requested behavior needs persistence.
- Never assume Next.js patterns. Use the TanStack Start APIs and versions already installed.

## 2. Define the contract

- State user-visible acceptance criteria.
- Identify authenticated actor, resource owner, permitted action, input schema, response shape, empty/error states, and affected URL state.
- Determine if the feature interacts with another user's board. Board viewing requires an accepted share; it does not imply permission to modify the owner's todos.

## 3. Implement vertically

- UI and navigation follow existing TanStack Router route patterns.
- Server functions use the existing `createServerFn` convention and explicit GET/POST method.
- Validate input using Zod at the server-function boundary.
- Authenticate inside the server handler; do not trust browser-supplied user or owner IDs.
- Keep domain rules in the operations modules and persistence in repository adapters when consistent with the feature.
- Scope todo queries and mutations to the authenticated `userId`; add a distinct, reviewed authorization rule for any new collaboration capability.
- Keep server-only imports and environment secrets out of client modules.

## 4. Test

- Add unit tests for domain rules and validation.
- Add database integration tests for Prisma query/ownership behavior where persistence changes.
- Add Playwright tests for critical user journeys and responsive behavior where user-visible flows change.
- Use isolated PostgreSQL test data only.

## 5. Verify and report

Run relevant existing npm scripts: `npm test`, `npm run test:e2e`, `npm run typecheck`, `npm run prisma:validate`, and `npm run build` when scope justifies them. Do not invent lint scripts. Do not set `VERCEL_ENV=production` in local/CI validation because the build script runs production migrations under that condition.

Report acceptance criteria, implementation decisions, actual commands/results, and known limitations.
