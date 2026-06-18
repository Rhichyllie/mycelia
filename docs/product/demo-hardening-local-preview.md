# Demo Hardening Local Preview

Phase 3L enables a supported local-only preview path for the controlled
MYCELIA demo surfaces.

It follows Phase 3K because the pilot walkthrough now exists at
`/mycelia/demo`, but the standard `pnpm dev` command remains intentionally
guarded. Phase 3L adds a narrow command for browser inspection without
activating production runtime behavior.

## Purpose

The goal is to let a developer visually inspect the current controlled demo
surfaces during local development.

Run:

```bash
pnpm demo:local
```

The command starts the local Next.js development server on `127.0.0.1` and
port `3000` by default. To use a different port, set
`MYCELIA_DEMO_LOCAL_PORT`.

On Windows and non-Windows systems, the script launches the local Next CLI
through the current Node executable with argument arrays. It does not spawn a
single shell command string.

## Local URLs

Open:

- `http://127.0.0.1:3000/mycelia`
- `http://127.0.0.1:3000/mycelia/demo`
- `http://127.0.0.1:3000/mycelia/request/new`
- `http://127.0.0.1:3000/mycelia/approval/decision`
- `http://127.0.0.1:3000/mycelia/investigation`

## Why `pnpm dev` Remains Guarded

`pnpm dev` is still blocked by the Phase 0 guard because it is a broad product
command. The local demo command is intentionally named, route-scoped and
documented as non-production preview only.

This keeps the production safety boundary clear: local visual inspection is
allowed, while runtime activation remains blocked.

## What It Does

- Starts Next.js dev mode through the local dependency.
- Binds to `127.0.0.1`.
- Prints the supported MYCELIA local demo URLs.
- Sets `MYCELIA_LOCAL_DEMO_PREVIEW=1` for operator clarity.
- Enables browser inspection of the controlled Phase 3K walkthrough and its
  linked preview surfaces.
- Renders the pilot route as a guided walkthrough with scenario cards,
  operational timeline, client value, presenter mode and safety boundary.

## What It Does Not Do

- It does not activate production runtime execution.
- It does not persist live requests or approval decisions.
- It does not create API routes.
- It does not create auth, RBAC or notifications.
- It does not run migrations or write database files.
- It does not call Prisma.
- It does not execute replay.
- It does not call tools or external services.
- It does not create export, PDF or download behavior.
- It does not create a broad workflow builder.
- It does not create dashboard, list or search scope.
- It does not expand MYCELIA into SaaS operations.

## Contract

The descriptive contract lives in `src/mycelia/demo-local-preview/`.

It defines:

- command name;
- local host;
- default port;
- allowed local routes;
- safety boundary;
- forbidden capabilities;
- preview status.

Preview statuses are:

- `DEMO_LOCAL_PREVIEW_READY`;
- `DEMO_LOCAL_PREVIEW_BLOCKED`;
- `DEMO_LOCAL_PREVIEW_FAILED_SAFE`.

The contract does not start servers.

## Next Phase Recommendation

The next phase can improve visual polish or add a narrow demo operator handoff,
but it should still avoid production runtime activation, live persistence
writes, API/auth/RBAC, replay execution, export behavior, broad workflow
builder scope, broad dashboard/list/search and SaaS expansion unless explicitly
planned.
