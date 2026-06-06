# MYCELIA

MYCELIA is in Phase 0 bootstrap. The active runtime, API, database schema, and
product UI have not started.

The former active MapIA-derived implementation was quarantined under
`legacy/mapia-active-snapshot/` and is reference-only. It must not be used as the
MYCELIA runtime foundation without explicit architecture review.

Canonical architecture lives in `docs/mycelia/`. Implementation alignment
scaffolding lives in `docs/architecture/`. Contract registry placeholders live
in `contracts/`.

## Safe Phase 0 Command

```bash
pnpm validate:phase0
```

This runs the current lint, typecheck, no-active-tests Vitest baseline, and
documentation/registry presence check.

## Guarded Commands

`pnpm dev`, `pnpm build`, and `pnpm start` are intentionally guarded for now.
They do not start Next.js because the active app shell has not been rebuilt.

## CI Baseline

Phase 0 CI runs `pnpm validate:phase0`.

Runtime and product build CI will be added later, after implementation begins.
The CI intentionally does not run `pnpm dev`, `pnpm build`, `pnpm start`, Prisma
commands, migrations, or deployment steps.

Future implementation work must follow
`docs/mycelia/19-codex-operational-alignment-and-engineering-constitution.md`.
Do not revive MapIA as the active MYCELIA foundation.
