# What's Going On

Next.js rewrite of the original aggregator, built around App Router pages, Route Handlers, and Drizzle-backed persistence.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Local Database Modes

PostgreSQL:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whats_going_on
DB_DRIVER=postgres
DAILY_SUMMARY_SECRET=replace-me
```

PGlite:

```bash
DB_DRIVER=pglite
PGLITE_DATA_DIR=.data/pglite
DAILY_SUMMARY_SECRET=replace-me
```

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run db:generate
npm run db:push
```

## Current Scope

- Implemented: GitHub source registration, task records, summaries, config APIs, Drizzle schema, optional PGlite runtime.
- Not implemented yet: email ingestion, Slack ingestion, Feishu/Slack delivery, queue-backed workers, full LLM execution flow.

## Project Layout

```text
src/app            App Router pages and API routes
src/components     UI components
src/lib            Config, DB, sources, tasks, summaries, storage
drizzle/           SQL migrations and snapshots
```

## License

MIT
