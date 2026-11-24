---
agent: 'agent'
description: 'Assess a Prisma/PostgreSQL schema change and produce a safe rollout plan before migration work.'
---

Assess this data-model change:

${input:change:Describe the schema or data change}

Read the schema, Prisma config, migration history, affected repositories, and application reads/writes. Do not edit files or execute migrations.

Return:
- Current schema and data-flow impact.
- PostgreSQL-specific compatibility and locking considerations.
- Additive/expand-and-contract plan.
- Backfill and verification strategy, if needed.
- Deployment order for mixed application versions.
- Rollback limitations and forward-fix plan.
- Tests required against disposable PostgreSQL.

Never recommend editing an already-applied migration.
