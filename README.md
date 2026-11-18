# Todo dashboard

A full-stack todo application built with TanStack Start, React, TypeScript, Prisma, and PostgreSQL. Sign in with Google to view, create, and complete todos saved to your account. The dashboard includes task totals, completion progress, a seven-day creation chart, and task search and filters. Google sign-in requires a verified email address.

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

The app's data model is intentionally small: users own todos, and each todo has a title, completion flag, and creation time. The dashboard searches and filters on the server and displays 20 matching tasks per page. The checked-in sample fixture powers the Prisma seed. To regenerate it with DuckDB:

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

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production build |
| `npm run preview` | Preview the production build |
| `npm test` | Run focused unit tests |
| `npm run typecheck` | Check TypeScript types |
| `npm run prisma:generate` | Generate the Prisma client |
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
