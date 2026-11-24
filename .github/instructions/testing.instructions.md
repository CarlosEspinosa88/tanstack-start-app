---
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,e2e/**/*.ts"
---

# Test rules

- Unit/integration tests use Node's test runner through `tsx --test`; follow existing `node:test` and assertion conventions.
- Playwright browser tests live in `e2e/`, use Chromium, and start the application through the checked-in Playwright configuration.
- Use a dedicated disposable PostgreSQL database through `TEST_DATABASE_URL` for database-backed tests. Never point test setup at production or a shared development database.
- Prefer deterministic fixtures and isolated test data. Do not use real user accounts, credentials, production data, or real Google OAuth calls in tests.
- Cover ownership and authorization boundaries, invalid Zod input, empty/missing records, bulk-operation limits, and relevant race/failure paths.
- Do not add arbitrary sleeps, broad mocks that bypass the behavior under test, or flaky snapshots.
- Run the narrowest test first, then `npm test`, `npm run test:e2e`, and `npm run typecheck` as appropriate. Report exactly which checks ran.
