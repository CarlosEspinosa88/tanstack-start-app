# Todo dashboard

A full-stack todo application built with TanStack Start, React, TypeScript, Prisma, and SQLite. Sign in with Google to view, create, and complete todos saved to your account. The dashboard includes task totals, completion progress, a seven-day creation chart, and task search and filters. Google sign-in requires a verified email address.

The checked-in DuckDB fixture is used to seed sample users and todos into the local database; it is not shown as a shared dashboard.

## Requirements

- Node.js 22.12 or newer (or Node.js 20.19 or newer)
- npm
- Python 3.10+ and DuckDB's Python package to regenerate the sample fixture

## Run locally

```sh
npm install
npm run dev
```

Configure Google OAuth and the database before signing in. Copy `.env.example` to `.env`, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (for local development, `http://localhost:3000/auth/callback`), and a strong `JWT_SECRET`. In Google Cloud, enable the Google identity/OpenID sign-in flow and allow the same callback URL. The app uses the configured local SQLite database.

Apply migrations, generate the Prisma client, then start the app:

```sh
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Demo data and database

The app's data model is intentionally small: users own todos, and each todo has a title, completion flag, and creation time. The checked-in sample fixture powers the Prisma seed. To regenerate it with DuckDB:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-mock.txt
npm run mock:generate
```

To create/update the local SQLite schema and load the fixture:

```sh
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

The sample user is `demo@todo.dev`. Local database configuration is in `prisma.config.ts` and `prisma/schema.prisma`; the current setup uses `prisma/dev.db`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production build |
| `npm run preview` | Preview the production build |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Apply development migrations |
| `npm run prisma:seed` | Upsert the demo user and sample todos |
| `npm run mock:generate` | Run the DuckDB query and refresh the JSON fixture |

## Project layout

```text
src/
  data/mock-data.json   DuckDB-generated dashboard and seed fixture
  routes/               TanStack file-based routes
  server/               Server-only auth and Prisma access
prisma/
  migrations/           Database migrations
  schema.prisma         SQLite data model
  seed.ts               Fixture-to-Prisma seeder
scripts/
  generate_mock_data.py DuckDB fixture generator
```

`src/routeTree.gen.ts` and `generated/` are generated files; edit their source configuration or schema instead.
