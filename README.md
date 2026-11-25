# Todo dashboard

A full-stack todo application built with TanStack Start, React, TypeScript, Prisma, and PostgreSQL. Sign in with Google to manage your tasks and share your board with other users. Board owners can invite viewers or editors; editors can create, edit, complete, and delete tasks, while viewers have read-only access. The dashboard includes task totals, completion progress, a seven- or 30-day creation chart, URL-backed task search, filters, and bulk task actions. Google sign-in requires a verified email address.

The checked-in DuckDB fixture is used to seed sample users and todos into the local database; it is not shown as a shared dashboard.

## Requirements

- Node.js 22.12 or newer (or Node.js 20.19 or newer)
- npm
- Python 3.10+ and DuckDB's Python package to regenerate the sample fixture

## Run locally

```sh
npm install
```

Start a local PostgreSQL database with Docker (replace `YOUR_LOCAL_PASSWORD` with a password of your choice):

```sh
docker run --name daymark-postgres --restart unless-stopped \
  --publish 127.0.0.1:5432:5432 \
  --env POSTGRES_USER=daymark \
  --env POSTGRES_PASSWORD=YOUR_LOCAL_PASSWORD \
  --env POSTGRES_DB=daymark \
  --volume daymark-postgres-data:/var/lib/postgresql/data \
  --detach postgres:16-alpine
```

Copy `.env.example` to `.env` and set `DATABASE_URL` to `postgresql://daymark:YOUR_LOCAL_PASSWORD@localhost:5432/daymark?schema=public`, using the same password as above. Configure Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` set to `http://localhost:3000/auth/callback`) and a strong `JWT_SECRET` before signing in. In Google Cloud, allow that callback URL.

Apply migrations, generate the Prisma client, then start the app. On later runs, start the existing database with `docker start daymark-postgres`:

```sh
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Demo data and database

Users own todos, and accepted board shares grant either viewer or editor access according to the role selected by the owner. Todo reads and writes remain scoped to the board owner; editor mutations also require a current accepted editor share. The dashboard searches and filters on the server and displays 20 matching tasks per page. Search and reporting period are stored in the URL, and bulk actions are limited to selected tasks on the current page. The checked-in sample fixture powers the Prisma seed. To regenerate it with DuckDB:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-mock.txt
npm run mock:generate
```

To create/update the local PostgreSQL schema and load the fixture:

```sh
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

The sample user is `demo@todo.dev`. Database configuration is read from `DATABASE_URL` in `prisma.config.ts` and `prisma/schema.prisma`.

## Production release checks

Configure `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and a strong `JWT_SECRET` in Vercel's Production environment. Use the Supabase pooled connection for `DATABASE_URL` and a direct or session-pooler connection for `DIRECT_URL`, which Prisma uses to apply migrations. Set the Google redirect URI to the exact HTTPS callback URL (`https://<your-domain>/auth/callback`) and register that same URL with Google. Production session and OAuth state cookies are marked `Secure`; deploy behind HTTPS.

The production Vercel build runs `prisma migrate deploy` before building the app. Preview deployments do not run migrations. Verify the deployed app can complete Google sign-in, create/edit/complete/delete a task, and cannot access a task owned by a different account. CI validates the Prisma schema, tests OAuth callback and logout response flows, runs CRUD, bulk-action, and ownership integration tests against PostgreSQL, checks dashboard behavior in Chromium at mobile and desktop sizes, checks TypeScript, and builds the production app including the Prisma engine packaging check.

The board-role migration is additive: existing shares default to view-only, and older application code remains compatible with that database schema. Roll back application code without reverting the migration; do not remove the role column or enum while any deployment may use editor permissions.

## AI delivery pipeline

See the [issue-to-Draft-PR operator guide](.github/extensions/issue-to-draft-pr/README.md) for the approved local workflow. Daily findings are proposals and do not authorize implementation; a human must apply `ai:approved` to each issue before execution. The workflow creates Draft PRs only and never merges or deploys.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Apply migrations on Vercel production builds, regenerate Prisma Client for the build platform, then package its query engine with the production build |
| `npm run preview` | Preview the production build |
| `npm test` | Run focused unit tests |
| `npm run test:e2e` | Run Chromium dashboard tests; set `TEST_DATABASE_URL` and install the browser with `npx playwright install chromium` (tests skip without the database) |
| `npm run typecheck` | Check TypeScript types |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:validate` | Validate the Prisma schema |
| `npm run prisma:migrate` | Apply development migrations |
| `npm run prisma:deploy` | Apply migrations in deployment |
| `npm run prisma:seed` | Upsert the demo user and sample todos |
| `npm run mock:generate` | Run the DuckDB query and refresh the JSON fixture |

## Project layout

```text
src/
  data/mock-data.json   DuckDB-generated dashboard and seed fixture
  routes/               TanStack file-based routes
  server/               Server-only auth, todo queries, and focused tests
prisma/
  migrations/           Database migrations
  schema.prisma         PostgreSQL data model
  seed.ts               Fixture-to-Prisma seeder
scripts/
  generate_mock_data.py DuckDB fixture generator
```

`src/routeTree.gen.ts` and `generated/` are generated files; edit their source configuration or schema instead.
