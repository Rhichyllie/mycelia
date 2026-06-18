# Investigation Selection & Read-Only Boundary

Phase 3G introduces a narrow read-only selection boundary for the investigation
surface. It follows Phase 3F because the renderer and presentation contract are
already hardened; this phase changes how an investigation target is resolved
before rendering.

## Purpose

The boundary lets `/mycelia/investigation` resolve a specific investigation
target without becoming a mutable SaaS surface. It supports:

- a controlled reference investigation target;
- an explicit run-scope target using `tenantId`, `governedRunId` and
  `correlationId`.

It does not add broad search, listing, pagination, dashboard behavior, auth,
RBAC, replay, export or mutation.

## Read-Only Boundary

The selection module resolves the target, delegates reconstruction to the
persisted investigation read model, and returns the existing Phase 3F UI
descriptor. JSX receives only the presentation contract, not repository records
or storage-specific shapes.

The default route currently uses controlled read-only reference data through
the repository boundary. That is deliberate: Phase 3G proves target resolution
and read-only rendering without introducing production database connection or
customer search.

## State Handling

The boundary classifies outcomes as:

- `INVESTIGATION_TARGET_RESOLVED`
- `INVESTIGATION_TARGET_NOT_FOUND`
- `INVESTIGATION_TARGET_INCOMPLETE`
- `INVESTIGATION_TARGET_BLOCKED`
- `INVESTIGATION_TARGET_FAILED_SAFE`

Missing audit records, missing approval records and partial persistence
coverage remain visible as incomplete findings. Missing governed run records
produce a not-found result. Tenant/run scope mismatches produce blocked results.
Unsafe input fails closed.

## Safety

The boundary rejects unsafe raw-content fields and does not leak SQL details,
raw DB errors, stack traces, secrets, raw document content or tenant existence
outside the supplied scope.

It does not:

- mutate persisted records;
- create API routes;
- create auth, session or RBAC behavior;
- execute replay;
- execute tools;
- call external services;
- create export, download or PDF behavior;
- create broad dashboard/list/search behavior.

## Next Phase

Phase 3H adds a controlled governed request creation surface so operators can
inspect the safe request seed shape before policy/admission, approval and
investigation. It remains non-mutating and does not introduce API/auth scope,
replay execution, export behavior or broad dashboard/list/search.

Phase 3I adds a separate controlled approval decision preview for the approval
step. It does not execute approval decisions or add broad inbox behavior.
