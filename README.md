# MYCELIA

MYCELIA is a governed operational intelligence and governed agentic runtime
platform in staged development.

The current local product runs with:

- Next.js App Router;
- Prisma Client;
- PostgreSQL 16 in Docker;
- NextAuth development credentials;
- a seeded governed-run demo loop and Studio graph.

## Prerequisites

- Node.js
- pnpm
- Docker with Compose support

## Local Development From Scratch

```bash
pnpm install
pnpm docker:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`, sign in with:

- email: `admin@mycelia.local`
- password: `admin`

The Control Center should load with real seeded PostgreSQL data.

## Database Commands

```bash
pnpm docker:up
pnpm docker:down
pnpm docker:reset
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:reset
pnpm db:studio
```

`pnpm docker:reset` removes the local Postgres volume. It is for local demo
development only.

## Validation

```bash
pnpm validate:phase0
```

This runs lint, typecheck, Vitest, and the documentation check.

## Architecture

Canonical architecture lives under `docs/mycelia/`. Future implementation work
must follow `docs/mycelia/19-codex-operational-alignment-and-engineering-constitution.md`.
