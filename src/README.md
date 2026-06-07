# MYCELIA Source

Active MYCELIA source begins here.

## Implemented

- `src/mycelia/shared-kernel/`: Phase 1A shared TypeScript primitives for opaque IDs, classifications, Result helpers, safe errors, and `OrganizationalRuntimeContext`.
- `src/mycelia/tenancy-boundaries/`: Phase 1B pure TypeScript tenant, workspace, and project boundary scope/check primitives.
- `src/mycelia/runtime-identity/`: Phase 1C pure TypeScript runtime identity, request origin, request envelope, and identity denial primitives.
- `src/mycelia/event-envelope/`: Phase 1D pure TypeScript EventEnvelope shape, mode, subject, payload descriptor, ordering hint, validation, and denial primitives.

## Not implemented yet

No runtime lifecycle, `GovernedRun`, `RuntimeEnvelope` execution, event broker, event publishing, event persistence, canonical event catalog, persistence, Prisma schema, API routes, workflow execution, authentication system, authorization middleware, RLS, or UI exists yet.

Legacy MapIA code must remain under `legacy/` and must not be copied back without architecture review.
