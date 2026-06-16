# Active Prisma Placeholder

This active directory is intentionally empty after Phase 0B quarantine.

MYCELIA persistence implementation will be created in future phases. Do not copy
MapIA legacy Prisma schema or migrations back into this directory without
architecture review.

No runtime behavior or database migrations exist here yet.

Before adding persistence files, consult:

- `docs/architecture/registry.md`
- `docs/architecture/module-map.md`
- `contracts/README.md`

Phase 0C adds documentation and registry scaffolding only. No Prisma schema or
migration exists in the active implementation surface yet.

Phase 2R adds a TypeScript minimal persistent model scaffold under
`src/mycelia/runtime-persistence-model/`. The active Prisma surface still has no
schema, no migrations, no database connection and no generated client.
