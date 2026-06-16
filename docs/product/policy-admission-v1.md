# Policy/Admission v1

Phase 2T defines the first deterministic policy/admission decision layer for
the frozen `Governed compliance/document review flow`.

This is pure TypeScript decision logic only. It does not execute runtime,
persist data, connect to a database, import Prisma, create migrations, call
APIs, call tools, call external services, emit events, write audit records,
render UI, export files, generate PDFs or create downloadable artifacts.

## Risk Levels

Policy/admission v1 uses exactly these risk levels:

- `LOW`
- `MEDIUM`
- `HIGH`
- `UNKNOWN`
- `UNSAFE`

## Admission Outcomes

Policy/admission v1 returns exactly these outcomes for valid input:

- `ADMIT`
- `REQUIRE_APPROVAL`
- `DENY`

Invalid or unsafe input returns a safe denial instead of a decision.

## Input Requirements

The input must be safe, bounded and tenant-scoped. It includes:

- `tenant_id`
- `run_id` or `correlation_id`
- `requester_ref`
- `resource_ref`
- `action`
- `purpose`
- `risk_level`
- `context_status`
- `tenant_boundary_status`
- `has_required_context`
- `policy_ref` or `policy_version`
- optional shallow safe metadata only

The input does not accept raw document content, unbounded payloads, arbitrary
evidence blobs, external service results, URLs, credentials, tokens, shell
commands, SQL queries or connection strings.

## Context and Boundary Statuses

Context status values:

- `RESOLVED`
- `MISSING`
- `AMBIGUOUS`

Tenant boundary status values:

- `MATCHED`
- `MISMATCHED`
- `UNKNOWN`

## Decision Rules

The deterministic rules fail closed:

- invalid schema input returns a safe denial;
- missing required context returns `DENY`;
- `MISSING` context returns `DENY`;
- `AMBIGUOUS` context returns `REQUIRE_APPROVAL` only when the tenant boundary is `MATCHED`;
- `AMBIGUOUS` context with `UNKNOWN` or `MISMATCHED` boundary returns `DENY`;
- `MISMATCHED` tenant boundary returns `DENY`;
- `UNKNOWN` tenant boundary returns `DENY`;
- `LOW` risk with resolved context and matched boundary returns `ADMIT`;
- `MEDIUM` risk with resolved context and matched boundary returns `REQUIRE_APPROVAL`;
- `HIGH` risk returns `DENY`;
- `UNKNOWN` risk with resolved context and matched boundary returns `REQUIRE_APPROVAL`;
- `UNKNOWN` risk without resolved context and matched boundary returns `DENY`;
- `UNSAFE` risk returns `DENY`.

## Lifecycle Mapping

Policy/admission v1 maps conceptually to the Phase 2S lifecycle intents:

- `ADMIT` -> `GRANT_ADMISSION`
- `REQUIRE_APPROVAL` -> `REQUIRE_APPROVAL`
- `DENY` -> `REJECT`

This mapping is a decision hint only. It does not transition a run or create a
state snapshot.

## Persistence Mapping

Policy/admission v1 maps conceptually to the Phase 2R persistence scaffold:

- every decision maps to a future `PolicyDecisionRecord`;
- every decision maps to a future `AdmissionDecisionRecord`;
- approval-required decisions map to a future `ApprovalRequest`;
- every decision should become a future `AuditRecord` moment.

This mapping does not write records and does not create active persistence.

## Approval Implications

`REQUIRE_APPROVAL` means a future approval gate should be created before the
run continues. Phase 2T does not create an approval queue, approval UI,
approval storage, notification workflow or approver identity resolver.

## Audit Implications

Every decision and safe denial should become audit-addressable in a future
audit commit boundary phase. Phase 2T does not write audit records, append audit
logs, emit events, sign records, seal records, hash-chain records or export
evidence.

Phase 2U defines that audit commit boundary as pure in-memory requirement
classification. It marks policy/admission decisions as audit-addressable but
still does not write audit records, append logs or emit events.

## Fail-Closed Behavior

Invalid, missing, malformed, ambiguous or unsafe inputs return safe denials.
Denials do not expose tenant existence, hidden policy state, raw document
content, sensitive metadata, approval internals, audit internals or database
state.

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
- workflow execution;
- approval queue;
- replay execution;
- tool execution;
- external integrations;
- raw document content;
- export/PDF/download behavior.

## Next Phases

The next runtime-slice phases remain:

- 2V Approval Gate v1
- 2W Investigation View v1

Those phases should continue to preserve narrow scope and avoid broad workflow,
API, auth, persistence or external-integration expansion until the minimal
governed compliance/document review flow is coherent.
