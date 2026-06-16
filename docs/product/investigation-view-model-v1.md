# Investigation View Model v1

Phase 2W defines the first pure TypeScript investigation view model for the
minimal governed runtime slice.

It assembles a safe descriptor from provided lifecycle, policy/admission,
approval, audit-boundary and persistence-reference descriptors. It does not
create UI, query databases, persist data, execute runtime, emit events, write
audit records, append logs, call APIs, call tools, call external services,
export files, generate PDFs or create downloadable artifacts.

## Input Requirements

The input must be safe, bounded and tenant-scoped. It includes:

- `tenant_id`
- `run_id` or `correlation_id`
- governed run reference
- lifecycle decision descriptors
- policy/admission decision descriptor
- optional approval gate decision descriptor
- audit boundary decisions
- persistence record references
- investigation purpose
- requested-by reference
- optional shallow safe metadata only

The input does not accept raw document content, unbounded payloads, arbitrary
evidence blobs, external service results, raw approval comments, full user
profile objects or raw audit log payloads.

## Investigation Sections

The assembled view model includes exactly these sections:

- `overview`
- `runStatus`
- `timeline`
- `policyAdmission`
- `approval`
- `auditCoverage`
- `persistenceRefs`
- `openQuestions`
- `limitations`
- `nextActions`

Each section is a safe descriptor only.

## Timeline Assembly

The timeline is derived only from provided descriptors:

- lifecycle decisions;
- policy/admission decision;
- approval decision when present;
- audit boundary decisions.

Entries are sorted by explicit sequence values. The model does not infer missing
events and does not reconstruct hidden runtime state.

## Finding Severities

Findings use exactly these severities:

- `INFO`
- `WARNING`
- `BLOCKER`

Core missing descriptors fail closed. Non-core gaps may be represented as safe
findings when the input is otherwise valid.

## Deterministic Assembly Rules

- A valid governed run reference is required.
- Valid lifecycle decisions are required.
- A valid policy/admission decision is required.
- An approval gate decision is required when policy/admission requires approval.
- Audit boundary coverage for `POLICY_EVALUATED` is required.
- Audit boundary coverage for `ADMISSION_DECIDED` is required.
- Cross-tenant mismatches fail closed.
- Unsafe metadata fails closed.
- Missing descriptors are not inferred.

## Completeness Status

The decision returns one completeness status:

- `COMPLETE`
- `INCOMPLETE`
- `BLOCKED`

Valid inputs with warning findings return `INCOMPLETE`. Valid inputs with no
warning or blocker findings return `COMPLETE`. Core blockers return safe
denials before a view is assembled.

## Module Mapping

The investigation view model aligns conceptually with:

- `src/mycelia/investigation-bundle/`
- `src/mycelia/audit-timeline/`
- `src/mycelia/audit-record/`
- `src/mycelia/audit-commit-boundary/`
- `src/mycelia/approval-gate-v1/`
- `src/mycelia/policy-admission-v1/`
- `src/mycelia/governed-run-lifecycle/`
- `src/mycelia/runtime-persistence-model/`
- `src/mycelia/runtime-slice-technical-plan/`

It does not replace those modules and does not read from storage.

## Fail-Closed Behavior

Invalid, incomplete, unsafe or cross-tenant inputs return safe denials. Denials
do not expose tenant existence, hidden investigation state, raw input payloads,
sensitive metadata, database reads or record writes.

## Out of Scope

- runtime execution;
- persistence;
- database reads;
- migrations;
- Prisma generate;
- repository/service layer;
- API routes;
- auth;
- UI rendering;
- event emission;
- audit record writing;
- append log writing;
- workflow execution;
- replay execution;
- tool execution;
- external integrations;
- raw document content;
- export/PDF/download behavior.

## Next Phases

The next runtime-slice phase is:

- 2X Replay Dry-Run Descriptor v1

Future phases can use this view model as the safe investigation read-model
contract before activating any database-backed investigation view or UI.
