# Runtime Slice Technical Plan

Phase 2Q defines the smallest technical runtime slice that can eventually prove the frozen use case: governed compliance/document review flow.

Linked offer: Governed Compliance Flow Pilot.

This is a technical plan only. It does not execute runtime, persist data, call APIs, call tools, call external services, create auth, create database schema, create Prisma migrations, export files, generate PDFs or create downloadable artifacts.

Related scaffold: [Minimal Persistent Model Scaffold](../persistence/minimal-persistent-model-scaffold.md).
Related lifecycle layer: [Minimal Governed Run Lifecycle](../runtime-logic/minimal-governed-run-lifecycle.md).
Related decision layer: [Policy/Admission v1](../runtime-logic/policy-admission-v1.md).
Related audit boundary: [Audit Commit Boundary](../runtime-logic/audit-commit-boundary.md).
Related approval layer: [Approval Gate v1](../runtime-logic/approval-gate-v1.md).
Related investigation read model: [Investigation View Model v1](../runtime-logic/investigation-view-model-v1.md).
Related replay dry-run descriptor: [Replay Dry-Run Descriptor v1](../runtime-logic/replay-dry-run-descriptor-v1.md).
Related in-memory orchestrator: [Internal Runtime Orchestrator v1](../runtime-logic/internal-runtime-orchestrator-v1.md).
Related consistency audit: [Runtime Slice Consistency Audit](../runtime-logic/runtime-slice-consistency-audit.md).
Related schema activation: [Minimal Persistence Activation](../persistence/minimal-persistence-activation.md).

## Runtime Slice Goal

The first runtime slice must prove one narrow governed compliance/document review flow. It must transform existing descriptors and contracts into one controlled operational lifecycle without becoming a general-purpose workflow platform.

The slice must support future assessment and pilot delivery by proving the minimum chain: request, context, tenant boundary, policy/admission, approval, state transition, audit, investigation and replay dry-run descriptor.

## Minimal Runtime Flow

1. Create governed request
2. Resolve organizational context
3. Check tenant/context boundary
4. Classify risk/policy
5. Decide admission
6. Pause for approval when required
7. Resume after approval
8. Transition run state
9. Commit audit record
10. Prepare investigation view
11. Prepare replay dry-run descriptor
12. Mark run completed or rejected

## Future Persistent Entity Plan

This section is an entity plan. Phase 2R adds a TypeScript persistence scaffold for the first persistence slice, but still does not activate database access, migrations or runtime persistence. Phase 2S adds pure in-memory lifecycle transition logic. Phase 2T adds pure in-memory policy/admission decision logic. Phase 2U adds pure in-memory audit requirement classification. Phase 2V adds pure in-memory approval gate decision logic. Phase 2W adds pure in-memory investigation view model assembly from provided descriptors. Phase 2X adds pure in-memory replay dry-run descriptor assembly. Phase 2Y composes those pure layers into one in-memory orchestration descriptor.

First persistence slice:

- GovernedRun
- RuntimeStateSnapshot
- PolicyDecisionRecord
- AdmissionDecisionRecord
- ApprovalRequest
- AuditRecord

Later slice:

- InvestigationCase or InvestigationBundleView
- ReplayDryRunPlan

These entities relate to the existing descriptor modules under `src/mycelia/domain-contracts/governed-run/`, `runtime-state/`, `state-transition/`, `policy-decision-gateway/`, `runtime-admission-gateway/`, `audit-record/`, `audit-recorder/`, `investigation-bundle/` and `replay-plan/`.

## State Lifecycle Plan

The narrow lifecycle for the first runtime slice is:

- CREATED
- CONTEXT_RESOLVED
- POLICY_EVALUATED
- ADMISSION_GRANTED
- WAITING_APPROVAL
- APPROVED
- REJECTED
- RUNNING
- COMPLETED
- CANCELLED
- FAILED

Phase 2S implements this lifecycle as pure in-memory transition logic only. It does not create state snapshots, persist state or execute runtime.

## Policy/Admission v1

Deterministic v1 behavior:

- low risk: admit
- medium risk: require approval
- high risk: deny
- missing context: deny
- tenant/context mismatch: deny
- unsafe/unknown classification: require approval when safe, otherwise deny

The rule is fail-closed. Missing, malformed, ambiguous or unsafe inputs must deny or require approval without inferring tenant, workspace, project or risk context.

Phase 2T implements this as deterministic pure TypeScript decision logic in `src/mycelia/runtime-logic/policy-admission-v1/`. It relates to `src/mycelia/domain-contracts/policy-decision-gateway/` and `src/mycelia/domain-contracts/runtime-admission-gateway/`, but does not implement a real policy engine, approval queue, persistence or runtime execution.

## Approval Gate v1

Approval is required when policy or admission returns `REQUIRE_APPROVAL`, when risk is medium, or when classification is uncertain but safe enough for human review.

An approval request should contain run, tenant, request summary, policy/admission references, risk classification, conceptual approver role and safe evidence references.

Allowed outcomes:

- APPROVE
- REJECT
- TIMEOUT
- CANCEL

Phase 2V implements this as deterministic pure TypeScript decision logic in `src/mycelia/runtime-logic/approval-gate-v1/`. It resolves approval-required decisions in memory, maps outcomes to lifecycle intent hints, maps approval moments to the audit commit boundary and maps decisions conceptually to persistence records.

This does not implement an approval queue, approval UI, approval storage, notification workflow, approver identity resolver, audit writing, event emission or runtime execution.

## Audit Commit Boundary

Lifecycle moments that must eventually produce audit records:

- governed request created
- context resolved
- policy evaluated
- admission decided
- approval requested
- approval decided
- state transitioned
- run completed
- run rejected
- run cancelled
- run failed

Audit evidence references should include request, context, policy, admission, approval, runtime state, state transition, investigation and replay dry-run references.

Hash-chain, signing, sealing, compliance export and audit storage are not implemented in this phase.

Phase 2U implements this as a pure audit commit boundary in `src/mycelia/runtime-logic/audit-commit-boundary/`. It classifies audit-addressable moments and requirement levels, but does not write audit records, append logs, emit events or create audit storage.

## Investigation View v1

A future investigation view should read the governed run, state snapshots, policy decision, admission decision, approval request, audit records and replay dry-run plan when available.

It must show request identity, tenant scope, policy/admission outcome, approval status, state lifecycle history, audit evidence references and replay dry-run readiness.

It must not infer tenant, workspace, project, approver identity, policy basis or missing audit evidence.

Phase 2W implements this as a pure TypeScript investigation view model in `src/mycelia/runtime-logic/investigation-view-model-v1/`. It assembles a safe descriptor from provided lifecycle, policy/admission, approval, audit-boundary and persistence-reference descriptors.

This does not implement UI, database reads, repository/service logic, persistence, audit writing, event emission or runtime execution.

## Replay Dry-Run v1

Replay dry-run v1 is descriptor reconstruction from recorded run, state, decision, approval and audit references.

It guarantees:

- no side effects
- no tool execution
- no external calls
- no real replay engine yet
- no state reconstruction beyond recorded descriptors

It differs from real replay execution because it only lists what would be inspected. It does not hydrate data, call tools, execute a replay engine or prove runtime determinism.

Phase 2X implements this as a pure TypeScript replay dry-run descriptor in `src/mycelia/runtime-logic/replay-dry-run-descriptor-v1/`. It assembles safe descriptor steps from supplied investigation, lifecycle, policy/admission, approval, audit-boundary and persistence-reference descriptors.

This does not execute replay, execute runtime, read databases, mutate state, call tools, call external services, emit events or write audit records.

## Internal Runtime Orchestrator v1

Phase 2Y implements a pure TypeScript in-memory orchestrator in `src/mycelia/runtime-logic/internal-runtime-orchestrator-v1/`. It composes lifecycle, policy/admission, approval, audit boundary, investigation and replay dry-run descriptor layers into one deterministic descriptor flow.

This does not execute runtime, execute replay, persist data, query databases, create APIs, emit events, write audit records, call tools or call external services.

## Implementation Sequence

Recommended next phases:

1. 2R Minimal Persistent Model Plan/Scaffold
2. 2S Minimal Governed Run Lifecycle
3. 2T Policy/Admission v1
4. 2U Audit Commit Boundary
5. 2V Approval Gate v1
6. 2W Investigation View v1
7. 2X Replay Dry-Run Descriptor v1
8. 2Y Internal Runtime Orchestrator, in-memory
9. 2Z Runtime Slice Consistency Audit
10. 3A Minimal Persistence Activation
11. 3B Runtime Repository Layer

## Out of Scope

- public API
- auth
- SaaS billing
- workflow builder
- general-purpose orchestration
- multiple integrations
- autonomous agents
- SDK
- external services
- production deployment
- enterprise multi-tenancy
- full replay execution
- hash-chain/signing/sealing
- export/PDF/downloads

## Safety Boundary

This plan now has seven pure implementation layers, a Phase 2Z consistency audit and a Phase 3A schema/migration contract. Phase 2S lifecycle transition logic, Phase 2T policy/admission decision logic, Phase 2U audit commit boundary classification, Phase 2V approval gate decision logic, Phase 2W investigation view model assembly, Phase 2X replay dry-run descriptor assembly and Phase 2Y in-memory orchestration composition remain descriptor-only. Runtime execution, replay execution, application DB reads/writes, API routes, external services, auth, approval queue, approval UI, database-backed investigation views, audit writing and PrismaClient usage remain not implemented. Phase 3B should own any runtime repository layer.
