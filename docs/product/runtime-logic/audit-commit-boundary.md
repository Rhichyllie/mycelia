# Audit Commit Boundary

Phase 2U defines the first audit commit boundary for the minimal runtime slice.

This is pure TypeScript boundary logic only. It does not execute runtime,
persist data, connect to a database, import Prisma, create migrations, call
APIs, call tools, call external services, emit events, write audit records,
append audit logs, sign records, seal records, hash-chain records, render UI,
export files, generate PDFs or create downloadable artifacts.

## Audit-Addressable Moments

The first runtime slice recognizes exactly these audit commit moments:

- `REQUEST_CREATED`
- `CONTEXT_RESOLVED`
- `TENANT_BOUNDARY_CHECKED`
- `POLICY_EVALUATED`
- `ADMISSION_DECIDED`
- `APPROVAL_REQUESTED`
- `APPROVAL_DECIDED`
- `LIFECYCLE_TRANSITIONED`
- `RUN_COMPLETED`
- `RUN_REJECTED`
- `RUN_CANCELLED`
- `RUN_FAILED`
- `INVESTIGATION_PREPARED`
- `REPLAY_DRY_RUN_PREPARED`

Unknown or invalid moments fail closed with a safe denial.

## Requirement Levels

Requirement levels are:

- `REQUIRED`
- `REQUIRED_LATER`
- `NOT_REQUIRED`

Lifecycle, policy/admission, approval and terminal run moments are `REQUIRED`.
Investigation and replay dry-run preparation are `REQUIRED_LATER`.
`NOT_REQUIRED` exists only for future explicitly safe non-governance
informational moments. Phase 2U does not add any extra non-governance moments.

## Decision Rules

Valid inputs return an audit commit boundary decision containing:

- moment;
- requirement;
- reason code;
- safe reason;
- audit record kind hint;
- conceptual persistence mapping;
- emission mapping;
- immutability note.

Invalid, unsafe, missing or unknown inputs return a safe denial. The boundary
does not infer hidden audit state and does not claim records were written.

## Input Requirements

The input must be safe, bounded and tenant-scoped. It includes:

- `tenant_id`
- `run_id` or `correlation_id`
- `moment`
- `source_module`
- `subject_ref`
- optional `actor_ref`
- optional `evidence_ref`
- `reason_code`
- `safe_summary`
- optional shallow safe metadata only

The input does not accept raw document content, unbounded payloads, arbitrary
evidence blobs, external service results, URLs, credentials, tokens, shell
commands, SQL queries or connection strings.

## Audit Record Kind Hints

The boundary maps moments to safe audit record kind hints:

- request and terminal run moments -> `GOVERNED_RUN`
- context resolution -> `SYSTEM_VALIDATION`
- tenant boundary check -> `TENANT_BOUNDARY`
- policy evaluation -> `POLICY_DECISION`
- admission decision -> `RUNTIME_ADMISSION`
- approval requested/decided -> `APPROVAL_DECISION`
- lifecycle transition -> `STATE_TRANSITION`
- investigation preparation -> `INVESTIGATION_DESCRIPTOR`
- replay dry-run preparation -> `REPLAY_PLAN_DESCRIPTOR`

Some hints reuse existing `audit-record` kinds. Approval, investigation and
replay hints are local safe hints because the existing audit record kind catalog
does not yet define exact runtime-slice kinds for those concepts.

## Persistence Mapping

Every boundary decision maps conceptually to future `AuditRecord`.

Relevant moments also map to first-slice records:

- request and terminal run moments -> `GovernedRun`
- lifecycle/context moments -> `RuntimeStateSnapshot`
- policy evaluation -> `PolicyDecisionRecord`
- admission decision -> `AdmissionDecisionRecord`
- approval requested/decided -> `ApprovalRequest`

This mapping does not create records and does not activate persistence.

Phase 2V approval gate decisions include conceptual audit boundary moments
`APPROVAL_REQUESTED` and `APPROVAL_DECIDED`. That mapping is descriptor-only and
does not write audit records, append logs or emit events.

Phase 2W investigation view model requires provided audit boundary coverage for
`POLICY_EVALUATED` and `ADMISSION_DECIDED` before assembling a view. Missing
core audit coverage fails closed instead of being inferred.

Phase 2X replay dry-run descriptor also requires provided audit boundary
coverage for `POLICY_EVALUATED` and `ADMISSION_DECIDED` before assembling a
dry-run descriptor. It does not write audit records or append logs.

Phase 2Y uses audit commit boundary decisions inside the in-memory orchestrator
to make request, policy, admission, approval and terminal moments
audit-addressable as descriptors only. It does not write audit records, append
logs or emit events.

## Emission Mapping

All decisions say `not emitted in this phase`.

Phase 2U does not emit events, publish messages, create broker records, create
outbox records or call external services.

## Immutability Expectations

Future audit records should be append-only. Phase 2U only records that
expectation as a descriptor-level note. It does not append logs, sign records,
seal records, hash-chain records or export evidence.

## Fail-Closed Behavior

Invalid inputs return safe denials. Denials do not expose tenant existence,
hidden audit state, raw document content, sensitive metadata, policy internals,
approval internals, runtime internals or database state.

## Out of Scope

- runtime execution;
- persistence;
- DB access;
- migrations;
- Prisma generate;
- repository/service layer;
- API routes;
- auth;
- UI;
- event emission;
- audit record writing;
- append log writing;
- signing;
- sealing;
- hash-chain;
- workflow execution;
- replay execution;
- tool execution;
- external integrations;
- raw document content;
- export/PDF/download behavior.

## Next Phases

The next runtime-slice phase is:

- 2Z Runtime Slice Consistency Audit

Those phases should continue to preserve narrow scope and avoid broad workflow,
API, auth, persistence or external-integration expansion until the minimal
governed compliance/document review flow is coherent.
