# Repository guide

## Application

- This is a TanStack Start and React todo app. Its Prisma schema in `prisma/schema.prisma` is the source of truth: users own todos with a title, `done` flag, and `createdAt` timestamp.
- The home dashboard is a mock-data view backed by `src/data/mock-data.json`. That same fixture is loaded into SQLite by `prisma/seed.ts`.
- `scripts/generate_mock_data.py` runs the SQL in `prisma/mock-data.sql` through DuckDB to refresh the fixture.

## Development

- Install JavaScript dependencies with `npm install`; run the app with `npm run dev`.
- Regenerate the fixture in a virtual environment: `python3 -m venv .venv`, activate it, install `requirements-mock.txt`, then run `npm run mock:generate`.
- Generate the Prisma client and apply migrations before seeding a local database: `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`.
- Run `npm run build` to check the production build.

## Change conventions

- Keep UI routes in `src/routes/`, server-only database/auth code in `src/server/`, and sample-data generation in `scripts/` and `prisma/`.
- Keep mock fields aligned with the Prisma schema; do not imply fields such as due dates or completion timestamps that the model does not store.
- Do not hand-edit `src/routeTree.gen.ts` or files in `generated/`.
- Preserve existing TypeScript, React, and Prisma patterns. Keep credentials out of source control and use `.env.example` for environment variable names.
