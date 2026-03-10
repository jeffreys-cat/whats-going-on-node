# Next.js Rewrite Scaffold

This repository now contains a parallel Next.js rewrite scaffold alongside the existing Flask app.

## What was added

- `src/app`: App Router pages and API Route Handlers
- `src/lib`: service-layer modules for config, sources, tasks, summaries, storage, and LLM adapters
- `src/lib/db/schema.ts`: Drizzle schema for the external-storage architecture
- `package.json`, `tsconfig.json`, `next.config.ts`: Next.js + TypeScript project setup

## First-run checklist

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Pick a local database mode:

   PostgreSQL:

   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whats_going_on
   DB_DRIVER=postgres
   DAILY_SUMMARY_SECRET=replace-me
   ```

   Or embedded PGlite:

   ```bash
   DB_DRIVER=pglite
   PGLITE_DATA_DIR=.data/pglite
   DAILY_SUMMARY_SECRET=replace-me
   ```

4. Generate SQL with Drizzle:

   ```bash
   npm run db:generate
   ```

5. Push the schema for PostgreSQL, or let PGlite auto-apply migrations on startup:

   ```bash
   npm run db:push
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

## Current state

- Implemented:
  - layout and dashboard pages
  - config, source, task, and summary APIs
  - Drizzle schema for persistent external storage
  - optional PGlite runtime for local development
  - first vertical slice for GitHub source registration and digest generation
  - protected cron webhook for GitHub daily batch execution
- Not implemented yet:
  - queue-backed worker execution
  - email and Slack source ingestion
  - LLM provider integration
  - Feishu and Slack delivery

## Suggested next step

Use these calls to exercise the GitHub slice:

```bash
curl -X POST http://localhost:3000/api/config \
  -H 'content-type: application/json' \
  -d '{"id":"github_config","value":{"token":"ghp_xxx"}}'

curl -X POST http://localhost:3000/api/sources \
  -H 'content-type: application/json' \
  -d '{"sourceType":"github","provider":"github","externalId":"vercel/next.js","name":"Next.js","config":{"owner":"vercel","repo":"next.js"}}'

curl -X POST http://localhost:3000/api/tasks \
  -H 'content-type: application/json' \
  -d '{"taskType":"github_digest","sourceId":"<source-id>","params":{"days":3,"lang":"zh"},"runImmediately":true}'

curl -X POST http://localhost:3000/api/webhooks/cron/daily-summary \
  -H 'x-cron-secret: replace-me'
```
