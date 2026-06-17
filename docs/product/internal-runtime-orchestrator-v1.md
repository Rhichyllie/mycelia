# Internal Runtime Orchestrator v1

Phase 2Y defines the first pure TypeScript internal runtime orchestrator for the
minimal governed runtime slice.

It composes the existing pure descriptor layers into one deterministic in-memory
flow for the governed compliance/document review use case. It does not execute
runtime, execute replay, persist data, query databases, call APIs, call tools,
call external services, emit events, write audit records, append logs, render
UI, export files, generate PDFs or create downloadable artifacts.

## Orchestration Statuses

The orchestrator returns exactly these descriptor statuses:

- `COMPLETED_DESCRIPTOR`
- `WAITING_APPROVAL`
- `REJECTED_DESCRIPTOR`
- `FAILED_DESCRIPTOR`
- `BLOCKED`

`COMPLETED_DESCRIPTOR` means the descriptor-only flow reached a complete
in-memory outcome. It does not mean real runtime work completed.

## Input Requirements

The input is safe, bounded and tenant-scoped. It includes:

- tenant, run and correlation identifiers;
- requester and resource references;
- action and purpose;
- risk, context and tenant-boundary status;
- policy reference or version;
- optional approval decision descriptor;
- orchestration purpose and requested-by reference;
- safe persistence record references;
- optional shallow safe metadata only.

The input does not accept raw document content, unbounded payloads, arbitrary
evidence blobs, external service results, raw approval comments, full user
profile objects, raw audit log payloads or tool execution payloads.

## High-Level Flow

The orchestrator performs descriptor-only composition:

1. Validate input.
2. Resolve context descriptor from `CREATED` to `CONTEXT_RESOLVED`.
3. Move from `CONTEXT_RESOLVED` to `POLICY_EVALUATED`.
4. Evaluate policy/admission v1.
5. Apply the policy lifecycle intent.
6. Classify audit boundaries for request, context, tenant boundary, policy,
   admission and lifecycle moments.
7. If approval is required and missing, return `WAITING_APPROVAL`.
8. If approval is supplied, evaluate approval gate v1 and apply its lifecycle
   intent.
9. For admitted or approved descriptor flows, move through `RUNNING` to
   `COMPLETED`.
10. For denied, rejected or timed-out descriptor flows, return the matching
    rejected or failed descriptor status.
11. For terminal descriptors, assemble investigation view model v1.
12. When investigation exists, assemble replay dry-run descriptor v1.

## Descriptor Sections

The returned orchestration descriptor includes:

- orchestration status;
- input references;
- ordered orchestration steps;
- lifecycle decisions;
- policy/admission decision;
- optional approval gate decision;
- audit boundary decisions;
- optional investigation view decision;
- optional replay dry-run decision;
- persistence mapping;
- blocked actions;
- safe summary;
- limitations;
- next actions.

## Step Ordering

Steps are deterministic and ordered by explicit sequence:

- `VALIDATE_INPUT`
- `RESOLVE_CONTEXT_DESCRIPTOR`
- `EVALUATE_POLICY_ADMISSION`
- `APPLY_ADMISSION_LIFECYCLE`
- `EVALUATE_APPROVAL_GATE`
- `APPLY_APPROVAL_LIFECYCLE`
- `EVALUATE_AUDIT_BOUNDARIES`
- `ASSEMBLE_INVESTIGATION_VIEW`
- `ASSEMBLE_REPLAY_DRY_RUN_DESCRIPTOR`
- `FINALIZE_DESCRIPTOR`

Waiting approval descriptors stop before completed investigation and replay
descriptor assembly.

## Module Mapping

Internal runtime orchestrator v1 aligns conceptually with:

- `src/mycelia/runtime-slice-technical-plan/`
- `src/mycelia/runtime-persistence-model/`
- `src/mycelia/governed-run-lifecycle/`
- `src/mycelia/policy-admission-v1/`
- `src/mycelia/approval-gate-v1/`
- `src/mycelia/audit-commit-boundary/`
- `src/mycelia/investigation-view-model-v1/`
- `src/mycelia/replay-dry-run-descriptor-v1/`

It does not replace those modules and does not activate runtime execution.

## No-Side-Effect Boundary

The orchestrator may call pure evaluator functions from earlier phases. It must
not persist records, write audit records, emit events, query databases, execute
runtime, execute replay, execute workflow, execute tools, call external
services, generate identifiers, generate timestamps or mutate inputs.

## Fail-Closed Behavior

Invalid, unsafe, incomplete or cross-tenant inputs return a safe denial with
`BLOCKED` status. Denials do not expose tenant existence, raw input payloads,
sensitive metadata, hidden runtime state, database reads, written records,
runtime execution or replay execution.

## Out of Scope

- runtime execution;
- replay execution;
- workflow execution;
- tool execution;
- persistence;
- database reads or writes;
- Prisma migrations;
- Prisma generate;
- repository/service layer;
- API routes;
- auth;
- UI;
- event emission;
- audit record writing;
- append log writing;
- external integrations;
- generated IDs or timestamps;
- export/PDF/download behavior.

## Next Phases

Phase 2Z audits the pure runtime-slice layers and keeps this orchestrator as
descriptor-only composition. Phase 3A adds only the schema/migration contract
for the persistence records referenced by the orchestrator descriptors.

Phase 3B adds the injected-client Runtime Repository Layer for the same
six-record slice. The orchestrator still does not execute runtime, persist
records, bootstrap PrismaClient, emit events or write audit records.

Phase 3C adds the Persisted Governed Flow Harness, which exercises deterministic
flow paths through the repository boundary and disposable SQLite persistence.
The orchestrator remains descriptor-only and is not promoted to a product
runtime surface.

Phase 3D Approval + Audit Runtime Slice now decides persisted pending approval
requests and records `APPROVAL_DECIDED` audit moments through the repository
boundary. The orchestrator remains descriptor-only and is not promoted to a
product runtime surface.

Phase 3E adds persisted investigation reconstruction over repository-backed
records. The orchestrator remains descriptor-only and is not promoted to a
database-backed runtime service, UI, API route or replay executor.
