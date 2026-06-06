# MYCELIA Source

Active MYCELIA source begins here.

## Implemented

- `src/mycelia/shared-kernel/`: Phase 1A shared TypeScript primitives for opaque IDs, classifications, Result helpers, safe errors, and `OrganizationalRuntimeContext`.
- `src/mycelia/tenancy-boundaries/`: Phase 1B pure TypeScript tenant, workspace, and project boundary scope/check primitives.

## Not implemented yet

No runtime lifecycle, `EventEnvelope` implementation, persistence, Prisma schema, API routes, workflow execution, authorization middleware, RLS, or UI exists yet.

Legacy MapIA code must remain under `legacy/` and must not be copied back without architecture review.
