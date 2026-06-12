# MYCELIA Source

Active MYCELIA source begins here.

## Implemented

- `src/mycelia/shared-kernel/`: Phase 1A shared TypeScript primitives for opaque IDs, classifications, Result helpers, safe errors, and `OrganizationalRuntimeContext`.
- `src/mycelia/tenancy-boundaries/`: Phase 1B pure TypeScript tenant, workspace, and project boundary scope/check primitives.
- `src/mycelia/runtime-identity/`: Phase 1C pure TypeScript runtime identity, request origin, request envelope, and identity denial primitives.
- `src/mycelia/event-envelope/`: Phase 1D pure TypeScript EventEnvelope shape, mode, subject, payload descriptor, ordering hint, validation, and denial primitives.
- `src/mycelia/policy-decision-gateway/`: Phase 1E pure TypeScript policy action, resource, purpose, obligation, decision request, decision, denial, and fail-closed check primitives.
- `src/mycelia/runtime-envelope/`: Phase 1F pure TypeScript runtime propagation context, mode, scope, policy context, correlation, replay flag, validation, and denial primitives.
- `src/mycelia/runtime-admission-gateway/`: Phase 1G pure TypeScript pre-runtime admission request, decision, denial, and fail-closed check primitives.
- `src/mycelia/governed-run/`: Phase 1H pure TypeScript governed run shell status, origin, metadata, validation, and fail-closed check primitives.
- `src/mycelia/runtime-state/`: Phase 1I pure TypeScript runtime state kind, state descriptor, snapshot descriptor, validation, and fail-closed check primitives.
- `src/mycelia/state-transition/`: Phase 1J pure TypeScript state transition intent, rule, descriptor, result, validation, and fail-closed check contracts.
- `src/mycelia/state-transition-coordinator/`: Phase 1K pure TypeScript state transition coordination request, result, validation, and fail-closed readiness skeleton.
- `src/mycelia/audit-record/`: Phase 1L pure TypeScript audit actor, subject, evidence reference, audit record, validation, and fail-closed descriptor contracts.
- `src/mycelia/audit-recorder/`: Phase 1M pure TypeScript audit recording request, result, recorder, validation, and fail-closed descriptor construction skeleton.

## Not implemented yet

No runtime lifecycle, `GovernedRun` execution, `RuntimeEnvelope` execution, real policy engine, approval workflow, obligation execution, runtime admission side effects, real state transition coordinator, state machine, state mutation, next-state creation, checkpoint creation, audit storage, audit append log, evidence store, record sealing, signing, hash chaining, compliance export, observability pipeline, event broker, event publishing, event persistence, canonical event catalog, persistence, Prisma schema, API routes, workflow execution, authentication system, authorization middleware, RLS, or UI exists yet.

Legacy MapIA code must remain under `legacy/` and must not be copied back without architecture review.
