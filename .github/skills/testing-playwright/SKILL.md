---
name: testing-playwright
description: Risk-based test procedure for Node unit tests, PostgreSQL integration tests, and Playwright Chromium journeys in this application.
---

# Testing strategy for this repository

## Select test layers

- Unit tests: use `node:test` with `tsx` for deterministic domain operations, date calculations, validation, cookie helpers, and utility behavior.
- Integration tests: use an isolated PostgreSQL database for Prisma repositories, auth/session routes, ownership, sharing, and migration-sensitive behavior.
- Browser tests: use Playwright Chromium in `e2e/` for navigation, authentication-dependent states, dashboard filters, CRUD, due dates, bulk actions, and responsive behavior.

## Design

- Assert observable behavior and security boundaries, not private implementation details.
- Include success, invalid input, unauthorized, forbidden, missing record, empty state, and concurrent/duplicate request paths as relevant.
- Use unique synthetic users and todos. Clean up test records reliably.
- Do not rely on external Google OAuth, real email addresses, production data, or network services.
- Avoid arbitrary waits; use Playwright's auto-waiting and condition-based assertions.

## Run

- Focused Node test: `npx tsx --test path/to/file.test.ts`.
- Unit/integration suite: `npm test`.
- Browser suite: set `TEST_DATABASE_URL` to a disposable PostgreSQL database, install Chromium with `npx playwright install chromium`, then run `npm run test:e2e`.
- TypeScript: `npm run typecheck`.
- Prisma schema: `npm run prisma:validate`.

The Playwright config starts the dev server on port 4173. Ensure the test database is migrated/seeded as the tests expect. Never point test variables at production.
