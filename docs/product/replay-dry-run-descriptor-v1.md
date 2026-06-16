# Replay Dry-Run Descriptor v1

Phase 2X defines the first pure TypeScript replay dry-run descriptor for the
minimal governed runtime slice.

It assembles a safe descriptor from supplied investigation, lifecycle,
policy/admission, approval, audit-boundary and persistence-reference
descriptors. It does not execute replay, execute runtime, query databases,
persist data, emit events, write audit records, append logs, call APIs, call
tools, call external services, render UI, export files, generate PDFs or create
downloadable artifacts.

## Replayability Statuses

Replay dry-run descriptor v1 uses exactly these statuses:

- `REPLAYABLE`
- `PARTIALLY_REPLAYABLE`
- `NOT_REPLAYABLE`
- `BLOCKED`

Invalid, unsafe, incomplete-core or cross-tenant inputs return a safe denial.
Denials are considered blocked rather than replayable descriptors.

## Side-Effect Policy

Every valid descriptor includes all side-effect policy markers:

- `NO_SIDE_EFFECTS`
- `DESCRIPTOR_ONLY`
- `NO_TOOL_EXECUTION`
- `NO_EXTERNAL_CALLS`
- `NO_STATE_MUTATION`

These markers are descriptor statements only. They do not configure a runtime
sandbox or execute any enforcement service.

## Input Requirements

The input must be safe, bounded and tenant-scoped. It includes:

- `tenant_id`
- `run_id` or `correlation_id`
- investigation view descriptor
- lifecycle timeline descriptors
- policy/admission decision descriptor
- optional approval gate decision descriptor
- audit boundary decision descriptors
- persistence record references
- replay purpose
- requested-by reference
- optional shallow safe metadata only

The input does not accept raw document content, unbounded payloads, arbitrary
evidence blobs, external service results, raw approval comments, full user
profile objects, raw audit log payloads or tool execution payloads.

## Descriptor Sections

The assembled descriptor includes exactly these sections:

- `overview`
- `sourceRefs`
- `replayability`
- `dryRunSteps`
- `sideEffectPolicy`
- `blockedActions`
- `requiredEvidence`
- `limitations`
- `nextActions`

Each section is a safe descriptor only.

## Dry-Run Steps

Dry-run steps are deterministic and ordered by explicit step order. They
describe inspection only:

1. Inspect governed run reference.
2. Inspect lifecycle timeline.
3. Inspect policy/admission decision.
4. Inspect approval gate decision when present.
5. Inspect audit boundary coverage.
6. Inspect persistence references.
7. Produce no-side-effect reconstruction summary.

The steps do not execute replay, execute workflow, call tools, read databases,
read files, mutate state, emit events or write audit records.

## Deterministic Assembly Rules

- A valid investigation view is required.
- A valid lifecycle timeline is required.
- A valid policy/admission decision is required.
- Audit boundary decisions are required.
- An approval gate decision is required when policy/admission requires approval.
- Cross-tenant mismatches fail closed.
- Unsafe metadata fails closed.
- Dry-run steps are sorted by explicit order.
- Missing events are not inferred.
- Descriptors must not claim replay execution happened.

## Replayability Rules

- `REPLAYABLE`: required descriptors are present, investigation completeness is complete and no blockers exist.
- `PARTIALLY_REPLAYABLE`: core descriptors are present, but non-core evidence remains incomplete.
- `NOT_REPLAYABLE`: supplied descriptors show a denied or rejected state that is safe to describe but not replayable.
- `BLOCKED`: input is invalid, unsafe, cross-tenant or missing core replay evidence.

## Module Mapping

Replay dry-run descriptor v1 aligns conceptually with:

- `src/mycelia/replay-plan/`
- `src/mycelia/investigation-view-model-v1/`
- `src/mycelia/investigation-bundle/`
- `src/mycelia/audit-timeline/`
- `src/mycelia/audit-record/`
- `src/mycelia/audit-commit-boundary/`
- `src/mycelia/approval-gate-v1/`
- `src/mycelia/policy-admission-v1/`
- `src/mycelia/governed-run-lifecycle/`
- `src/mycelia/runtime-persistence-model/`
- `src/mycelia/runtime-slice-technical-plan/`

It does not replace those modules and does not execute replay.

## Fail-Closed Behavior

Invalid, incomplete-core, unsafe or cross-tenant inputs return safe denials.
Denials do not expose tenant existence, hidden replay state, raw input payloads,
sensitive metadata, database reads or replay execution claims.

## Out of Scope

- runtime execution;
- replay execution;
- workflow execution;
- tool execution;
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
- external integrations;
- raw document content;
- export/PDF/download behavior.

## Next Phases

The next runtime-slice phase is:

- 2Y Internal Runtime Service Boundary

Future phases can use this descriptor as the safe replay dry-run planning
contract before activating replay UI, runtime service behavior or persistence.
