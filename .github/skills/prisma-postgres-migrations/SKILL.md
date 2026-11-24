---
name: prisma-postgres-migrations
description: Safe, production-aware workflow for Prisma schema and PostgreSQL migrations in this repository.
---

# Prisma + PostgreSQL migration procedure

## Discover

- Read `prisma/schema.prisma`, `prisma.config.ts`, `prisma/migrations/migration_lock.toml`, the migration history, repository adapters, and application rollout process.
- Confirm PostgreSQL-specific behavior. Do not infer SQLite from legacy files or old comments.
- Understand the distinction between application `DATABASE_URL` and migration `DIRECT_URL`.

## Design

- Classify each change: additive, destructive, backfill, index/constraint, enum, or type conversion.
- Evaluate table size, lock behavior, write load, default-value rewrite, FK/index build cost, uniqueness conflicts, and deployed application versions.
- Prefer expand-and-contract: add nullable/compatible schema, deploy code that tolerates both forms, backfill in bounded batches, verify, then remove obsolete schema in a later release.
- Preserve `Todo.dueDate` as a date-only PostgreSQL DATE field unless requirements explicitly change.

## Implement and verify

- Never edit an applied migration. Create a new migration with the current Prisma toolchain.
- Update seed data, repositories, validators, tests, and docs consistently.
- Validate schema and migration SQL against a disposable PostgreSQL database.
- Verify data invariants and indexes before rollout.
- Document deployment order, rollback limits, forward-fix strategy, and monitoring.

## Hard stop

Never run production migration, reset, drop, truncate, or destructive backfill commands from an agent session. Production execution needs explicit human approval and the team's normal deployment process.
