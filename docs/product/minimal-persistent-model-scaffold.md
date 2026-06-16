# Minimal Persistent Model Scaffold

Phase 2R defines the first persistence model scaffold for the governed compliance/document review flow.

This is a scaffold only. It does not execute runtime, persist data, connect to a database, create migrations, run Prisma generate, call APIs, call tools, call external services, export files, generate PDFs or create downloadable artifacts.

## Persistent Record Set

The first persistence slice contains exactly six planned records:

- GovernedRun
- RuntimeStateSnapshot
- PolicyDecisionRecord
- AdmissionDecisionRecord
- ApprovalRequest
- AuditRecord

Later records such as InvestigationCase, InvestigationBundleView and ReplayDryRunPlan remain out of the first persistence slice.

## Minimal Conceptual Fields

GovernedRun:

- id
- tenantId
- workspaceId optional or planned
- projectId optional or planned
- requestId or correlationId
- useCaseName
- status
- currentState
- riskLevel
- admissionStatus
- approvalStatus
- createdAt planned
- updatedAt planned

RuntimeStateSnapshot:

- id
- tenantId
- runId
- state
- sequence
- reason
- createdAt planned
- correlationId

PolicyDecisionRecord:

- id
- tenantId
- runId
- policyAction
- resource
- purpose
- riskLevel
- decision
- reason
- obligations
- createdAt planned

AdmissionDecisionRecord:

- id
- tenantId
- runId
- admissionStatus
- reason
- requiresApproval
- policyDecisionId
- createdAt planned

ApprovalRequest:

- id
- tenantId
- runId
- admissionDecisionId
- approvalStatus
- requestedRole
- decision
- decisionReason
- requestedAt planned
- decidedAt planned optional

AuditRecord:

- id
- tenantId
- runId
- kind
- subjectRef
- actorRef
- evidenceRef
- correlationId
- createdAt planned

## Shared Invariants

- Every persisted record is tenant-scoped.
- Every run-linked record references a governed run.
- Every state snapshot has monotonic sequence in future implementation.
- Every policy/admission/approval lifecycle change must be audit-addressable.
- No record stores raw sensitive document content in the first slice.
- Records use references and safe summaries instead of raw payloads.
- No external IDs should be treated as trusted without validation.
- No cross-tenant relationship is allowed.

## Prisma Scaffold Status

The active `prisma/` directory currently contains a placeholder README and no active `schema.prisma` convention.

Because there is no active Prisma schema to extend, Phase 2R does not create a full Prisma schema. No migration file was created. Prisma generate was not run.

Future Prisma modeling should derive from `src/mycelia/runtime-persistence-model/` and this document.

## TypeScript Descriptor Status

`src/mycelia/runtime-persistence-model/` defines readonly record descriptors and pure Zod schemas for the six first-slice records.

The descriptors and schemas are in-memory only. They do not read, write, connect, migrate or execute runtime.

Phase 2T policy/admission v1 maps its deterministic decisions conceptually to
`PolicyDecisionRecord`, `AdmissionDecisionRecord`, optional `ApprovalRequest`
and future `AuditRecord` moments. It does not write those records.

Phase 2U audit commit boundary maps governed runtime moments conceptually to
future `AuditRecord` plus related first-slice records. It does not create audit
storage, append logs or persist records.

Phase 2V approval gate maps approval outcomes conceptually to `ApprovalRequest`,
`AdmissionDecisionRecord`, `GovernedRun`, `RuntimeStateSnapshot` and future
`AuditRecord` moments. It does not persist records, create approval storage or
write audit records.

## Mapping to Existing Modules

- GovernedRun maps to `src/mycelia/governed-run/`.
- RuntimeStateSnapshot maps to `src/mycelia/runtime-state/` and `src/mycelia/state-transition/`.
- PolicyDecisionRecord maps to `src/mycelia/policy-decision-gateway/`.
- AdmissionDecisionRecord maps to `src/mycelia/runtime-admission-gateway/`.
- ApprovalRequest maps to `src/mycelia/approval-gate-v1/` plus policy/admission records.
- AuditRecord maps to `src/mycelia/audit-record/` and `src/mycelia/audit-recorder/`.

## Out of Scope

- runtime execution
- DB access
- migrations
- Prisma generate
- repository/service layer
- API
- auth
- UI
- event emission
- replay execution
- external integrations
- sensitive document storage
- hash-chain/signing/sealing
- export/PDF/download

## Next Implementation Phases

- 2W Investigation View v1
