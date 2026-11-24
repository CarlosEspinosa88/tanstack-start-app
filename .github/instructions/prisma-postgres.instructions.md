---
applyTo: "prisma/**/*.prisma,prisma/migrations/**/*.sql,prisma/seed.ts,prisma.config.ts"
---

# Prisma and PostgreSQL rules

- PostgreSQL is the configured provider. Confirm the actual schema and migration lock before designing SQL; do not assume SQLite syntax or semantics.
- The Prisma schema is `prisma/schema.prisma`; Prisma client generation targets `generated/`. Never hand-edit generated client files or query-engine binaries.
- `prisma.config.ts` prefers `DIRECT_URL` for migrations and falls back to `DATABASE_URL`. Keep local/CI application and migration URLs pointed at the intended database.
- Never modify a migration that has already been applied to a shared or production database. Add a new migration.
- Evaluate nullability, defaults, indexes, unique constraints, FK behavior, enum changes, table size, lock duration, backfill volume, and compatibility with old/new application versions.
- Prefer expand-and-contract deployments for changes that require coordinated app/schema rollout.
- The Todo `dueDate` is PostgreSQL `DATE`, not a timestamp. Preserve its date-only semantics and avoid timezone shifts.
- Test migration behavior against a disposable PostgreSQL database. Never reset, drop, or deploy migrations to production without explicit human approval.
- Update seed and relevant integration tests when model semantics change.
