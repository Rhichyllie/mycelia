# Persisted Investigation Read Model

Phase 3E creates the first persisted investigation read model for the governed
compliance/document review runtime slice.

It reads records already written by the Phase 3C persisted governed flow
harness and Phase 3D approval + audit runtime slice, then reconstructs a safe
investigation-ready descriptor. This phase comes before UI so persisted runtime
history can be explained, validated and bounded before any product surface
renders it.

## Purpose

The read model answers:

- what run was created;
- what state changes occurred;
- what policy/admission decisions occurred;
- whether approval was required;
- what approval decision happened;
- what audit records exist;
- what is missing;
- whether investigation is complete, incomplete, blocked or failed safe.

## Read Model Sections

The reconstructed descriptor includes:

- overview;
- state timeline;
- policy/admission;
- approval;
- audit trail;
- persistence coverage;
- findings;
- next actions.

Each section is a safe descriptor only. The module does not render UI, create
API routes, export files, generate PDFs or create downloadable artifacts.

## Reconstruction Sources

The read model reconstructs from the six Phase 3A records through the Phase 3B
repository boundary:

- `GovernedRun`
- `RuntimeStateSnapshot`
- `PolicyDecisionRecord`
- `AdmissionDecisionRecord`
- `ApprovalRequest`
- `AuditRecord`

It does not bypass the repository safety model with broad database access.

## Completeness Classification

Completeness values are:

- `COMPLETE`: root run, state timeline, policy/admission, required audit and
  required approval data are present and tenant/run scoped.
- `INCOMPLETE`: reconstruction is safe but expected non-root records or audit
  moments are missing.
- `BLOCKED`: the root run or tenant/run boundary cannot be trusted.
- `FAILED_SAFE`: unsafe input or repository failure prevents reconstruction.

Findings use `INFO`, `WARNING` and `BLOCKER` severities.

## Audit Coverage

The current minimal audit expectations are:

- `REQUEST_CREATED`
- `ADMISSION_DECIDED`
- `APPROVAL_DECIDED` when approval was decided

Missing audit moments produce warnings and incomplete reconstruction. The read
model does not invent audit records and does not pretend audit coverage is
complete when persisted evidence is missing.

## Safety Boundaries

The module fails closed when tenant or run identifiers are missing, the root
run is missing, tenant/run scope mismatches, repository errors occur or raw
content fields are supplied.

It does not leak SQL errors, stack traces, sensitive payloads, raw document
content or cross-tenant existence.

## Out Of Scope

Phase 3E does not add:

- UI;
- API routes;
- auth or RBAC;
- notifications;
- Postgres support;
- billing;
- replay execution;
- broad audit service;
- event store;
- audit sealing;
- export/PDF/download behavior;
- SaaS expansion.

## Relationship To 3C And 3D

Phase 3C proves governed flows can persist and read back low-risk completed,
medium-risk pending approval and high-risk rejected paths.

Phase 3D proves pending approval decisions can be persisted, reflected in state
snapshots and recorded as `APPROVAL_DECIDED` audit records.

Phase 3E turns those persisted records into an investigation-ready read model
without creating UI.

## Next Phase

Phase 3F adds the minimal investigation UI surface. It consumes the same
read-model shape through a static fixture and hardened presenter, keeping the
route read-only with no live database, API, auth, replay execution or export
behavior.

Phase 3G connects that surface back to this read model through a controlled
investigation selection boundary, read-only loader and mapper. The route no
longer depends exclusively on UI fixtures, but it still does not create API
routes, auth, mutation, replay, exports, broad search or broad database
ownership.
