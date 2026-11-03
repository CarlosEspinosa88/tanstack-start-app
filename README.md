# Todo dashboard

A full-stack todo application built with TanStack Start, React, TypeScript, Prisma, and SQLite. The home page is a sample dashboard with task totals, completion progress, a seven-day creation chart, and an interactive task list. Its reproducible demo fixture is generated with DuckDB and can also be loaded into the SQLite database through Prisma.

The sample activity chart uses the newest todo in the fixture as the end of its seven-day window, so the checked-in demo remains useful between fixture regenerations.

## Requirements

- Node.js 22.12 or newer (or Node.js 20.19 or newer)
- npm
- Python 3.10+ and DuckDB's Python package to regenerate the sample fixture

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The dashboard reads its demo data from `src/data/mock-data.json`, so it works without configuring OAuth or connecting to the database.

## Demo data and database

The app's data model is intentionally small: users own todos, and each todo has a title, completion flag, and creation time. The checked-in sample fixture powers the dashboard and Prisma seed. To regenerate it with DuckDB:

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
