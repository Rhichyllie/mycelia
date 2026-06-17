# MYCELIA Module Map

This module map describes current source truth and future placeholders. It does
not create runtime behavior, APIs, migrations, schemas, deployment readiness or
SaaS readiness.

## Implemented Source Modules

| Module | Status | Responsibility | Boundary |
|---|---|---|---|
| `src/mycelia/shared-kernel/` | IMPLEMENTED_CONTRACTS | Shared IDs, classifications, Result helpers and safe error primitives. | No app/runtime ownership. |
| `src/mycelia/tenancy-boundaries/` | IMPLEMENTED_CONTRACTS | Tenant, workspace and project boundary descriptors/checks. | No tenant resolver, RLS or database isolation. |
| `src/mycelia/runtime-identity/` | IMPLEMENTED_CONTRACTS | Runtime identity, request origin and request envelope descriptors. | No auth platform. |
| `src/mycelia/event-envelope/` | IMPLEMENTED_CONTRACTS | Event envelope descriptor contracts. | No broker, outbox or event persistence. |
| `src/mycelia/policy-decision-gateway/` | IMPLEMENTED_CONTRACTS | Policy decision request/result contracts. | No real policy engine. |
| `src/mycelia/runtime-envelope/` | IMPLEMENTED_CONTRACTS | Runtime envelope propagation descriptors. | No runtime execution. |
| `src/mycelia/runtime-admission-gateway/` | IMPLEMENTED_CONTRACTS | Admission request/result contracts. | No admission side effects. |
| `src/mycelia/governed-run/` | IMPLEMENTED_DESCRIPTORS | Governed run shell descriptors. | No executing run or persisted run. |
| `src/mycelia/runtime-state/` | IMPLEMENTED_DESCRIPTORS | Runtime state descriptors. | No persisted state or checkpoints. |
| `src/mycelia/state-transition/` | IMPLEMENTED_CONTRACTS | State transition intent/result contracts. | No state mutation. |
| `src/mycelia/state-transition-coordinator/` | IMPLEMENTED_CONTRACTS | State transition coordination descriptors. | No real coordinator runtime. |
| `src/mycelia/audit-record/` | IMPLEMENTED_CONTRACTS | Audit record descriptors. | No audit store. |
| `src/mycelia/audit-recorder/` | IMPLEMENTED_CONTRACTS | Audit recording descriptor construction. | No audit commit boundary. |
| `src/mycelia/audit-emission/` | IMPLEMENTED_CONTRACTS | Audit emission intent/result descriptors. | No publishing, broker or export. |
| `src/mycelia/audit-timeline/` | IMPLEMENTED_CONTRACTS | Audit timeline descriptors. | No storage or pagination. |
| `src/mycelia/investigation-bundle/` | IMPLEMENTED_CONTRACTS | Investigation bundle descriptors. | No investigation mode or case management. |
| `src/mycelia/replay-plan/` | IMPLEMENTED_CONTRACTS | Replay plan descriptors. | No replay execution or simulation. |
| `src/mycelia/demo-scenario/` | IMPLEMENTED_DESCRIPTORS | Demo scenario descriptors. | No execution. |
| `src/mycelia/demo-scenario-fixture/` | IMPLEMENTED_DESCRIPTORS | Demo fixture descriptors. | No seed data or executable fixtures. |
| `src/mycelia/demo-readiness-report/` | IMPLEMENTED_DESCRIPTORS | Demo readiness descriptors. | No export or rendering pipeline. |
| `src/mycelia/static-demo-artifact/` | IMPLEMENTED_DESCRIPTORS | Static demo artifact descriptors. | No file/PDF/JSON artifact generation. |
| `src/mycelia/first-static-demo/` | IMPLEMENTED_STATIC_DESCRIPTOR | First static demo descriptor set. | No runtime demo. |
| `src/mycelia/static-demo-text-renderer/` | IMPLEMENTED_PURE_FUNCTION | In-memory plain-text rendering of static demo descriptors. | No HTML, file output or export. |
| `src/mycelia/human-readable-static-demo-preview/` | IMPLEMENTED_STATIC_MODEL | Human-readable preview package. | No UI rendering or persistence. |
| `src/mycelia/read-only-static-demo-page/` | IMPLEMENTED_STATIC_VIEW | Read-only static demo view module. | No user input or API calls. |
| `src/mycelia/home-entry-surface/` | IMPLEMENTED_STATIC_VIEW | Static home entry surface. | No runtime behavior. |
| `src/mycelia/product-information-surface/` | IMPLEMENTED_STATIC_VIEW | Static MYCELIA product hub. | No runtime behavior. |
| `src/mycelia/executive-narrative-surface/` | IMPLEMENTED_STATIC_VIEW | Static executive narrative surface. | No runtime behavior. |
| `src/mycelia/static-demo-walkthrough-surface/` | IMPLEMENTED_STATIC_VIEW | Static guided walkthrough surface. | No replay simulation. |
| `src/mycelia/product-roadmap-surface/` | IMPLEMENTED_STATIC_VIEW | Static roadmap surface. | No activation of planned capabilities. |
| `src/mycelia/product-surface-shell/` | IMPLEMENTED_STATIC_VIEW | Shared static product shell. | Internal navigation only. |
| `src/mycelia/product-surface-index/` | IMPLEMENTED_STATIC_MODEL | Shared product surface catalog. | Internal route catalog only. |
| `src/mycelia/initial-use-case-freeze/` | IMPLEMENTED_STATIC_PLANNING | Phase 2N frozen first buyer-oriented use case. | No runtime or persistence. |
| `src/mycelia/pilot-offer-package/` | IMPLEMENTED_STATIC_PLANNING | Phase 2O assessment and pilot offer package. | No sales automation or runtime. |
| `src/mycelia/runtime-slice-technical-plan/` | IMPLEMENTED_STATIC_PLANNING | Phase 2Q minimal runtime slice technical plan. | No runtime execution, DB schema or persistence implementation. |
| `src/mycelia/runtime-persistence-model/` | IMPLEMENTED_STATIC_SCAFFOLD | Phase 2R minimal persistent model scaffold. | No DB access, migration, Prisma generate or repository layer. |
| `src/mycelia/governed-run-lifecycle/` | IMPLEMENTED_PURE_FUNCTION | Phase 2S minimal governed run lifecycle transition logic. | No persistence, event emission, audit writing or runtime service. |
| `src/mycelia/policy-admission-v1/` | IMPLEMENTED_PURE_FUNCTION | Phase 2T deterministic policy/admission v1 decision logic. | No real policy engine, approval queue, persistence, event emission or audit writing. |
| `src/mycelia/audit-commit-boundary/` | IMPLEMENTED_PURE_FUNCTION | Phase 2U audit-addressable moment and requirement classification. | No audit writing, append log, event emission, persistence or export. |
| `src/mycelia/approval-gate-v1/` | IMPLEMENTED_PURE_FUNCTION | Phase 2V deterministic approval gate decision logic. | No approval queue, approval UI, persistence, event emission or audit writing. |
| `src/mycelia/investigation-view-model-v1/` | IMPLEMENTED_PURE_FUNCTION | Phase 2W deterministic investigation view model assembly. | No UI, DB reads, persistence, event emission or audit writing. |
| `src/mycelia/replay-dry-run-descriptor-v1/` | IMPLEMENTED_PURE_FUNCTION | Phase 2X deterministic replay dry-run descriptor assembly. | No replay execution, tools, external calls, DB reads, persistence, event emission or audit writing. |
| `src/mycelia/internal-runtime-orchestrator-v1/` | IMPLEMENTED_PURE_FUNCTION | Phase 2Y deterministic in-memory composition of the pure runtime-slice descriptor layers. | No runtime execution, replay execution, persistence, DB reads, API, event emission or audit writing. |
| `src/mycelia/runtime-slice-consistency-audit/` | IMPLEMENTED_STATIC_AUDIT | Phase 2Z consistency audit for the 2R through 2Y minimal runtime slice. | No runtime execution, replay execution, persistence, DB reads, API, event emission or audit writing. |
| `src/mycelia/minimal-persistence-activation/` | IMPLEMENTED_STATIC_DESCRIPTOR | Phase 3A descriptor for the schema/migration contract. | No PrismaClient import, repository layer, DB reads/writes, runtime execution or audit writing. |
| `src/mycelia/runtime-repository-layer/` | IMPLEMENTED_REPOSITORY_BOUNDARY | Phase 3B injected-client repository boundary for the six first-slice records. | No PrismaClient instantiation, global DB client, API route, runtime execution, event emission or audit writing. |
| `src/mycelia/prisma-runtime-repository-adapter/` | IMPLEMENTED_INJECTED_ADAPTER | Phase 3C Prisma-like adapter for the repository boundary. | No global PrismaClient, import-time connection, API route, UI, auth or external service. |
| `src/mycelia/persisted-governed-flow-harness/` | IMPLEMENTED_PERSISTED_TEST_HARNESS | Phase 3C persisted governed flow harness for controlled local persistence. | No product runtime surface, API route, UI, auth, replay execution or external integration. |
| `src/mycelia/approval-audit-runtime-slice/` | IMPLEMENTED_NARROW_PERSISTED_SLICE | Phase 3D approval decision and minimal approval audit runtime slice. | No approval UI, auth, RBAC, notification runtime, event store, broad audit service, API route or replay execution. |

## Implemented App Router Surfaces

| Route | Status | Boundary |
|---|---|---|
| `/` | IMPLEMENTED_STATIC_READ_ONLY | Home entry surface. |
| `/mycelia` | IMPLEMENTED_STATIC_READ_ONLY | Product hub. |
| `/mycelia/executive` | IMPLEMENTED_STATIC_READ_ONLY | Executive narrative. |
| `/mycelia/static-demo` | IMPLEMENTED_STATIC_READ_ONLY | Static demo surface. |
| `/mycelia/walkthrough` | IMPLEMENTED_STATIC_READ_ONLY | Guided walkthrough. |
| `/mycelia/roadmap` | IMPLEMENTED_STATIC_READ_ONLY | Product roadmap. |

## Future Runtime Placeholders

| Future Module | Status | Notes |
|---|---|---|
| `core-runtime` | PURE_ORCHESTRATOR_ONLY | Internal runtime orchestrator v1 exists as descriptor composition only; no runtime kernel exists yet. |
| `workflow-orchestration` | NOT_IMPLEMENTED | No workflow engine exists yet. |
| `state-persistence` | SCHEMA_REPOSITORY_HARNESS_AND_APPROVAL_AUDIT_SLICE_ACTIVE | Runtime persistence model scaffold, Prisma schema/migration contract, injected-client repository boundary, Prisma-like adapter, persisted harness and approval/audit slice exist; no product runtime surface, global PrismaClient bootstrap or broad application DB integration exists yet. |
| `governance-policy-runtime` | PURE_V1_AND_NARROW_APPROVAL_DECISION_SLICE | Deterministic policy/admission v1 and approval gate v1 exist; Phase 3D persists pending approval decisions. No real policy engine, approval queue, approval UI, RBAC or notifications exist yet. |
| `audit-commit-boundary` | PURE_BOUNDARY_WITH_MINIMAL_APPROVAL_AUDIT_RECORD | Audit requirement classification exists and Phase 3D writes minimal `APPROVAL_DECIDED` AuditRecord entries; no broad durable audit writer, append log, sealing or export exists yet. |
| `investigation-view` | PURE_MODEL_ONLY | Investigation view model v1 exists in memory only; no real investigation UI, DB read layer or case management exists yet. |
| `replay-runtime` | PURE_DESCRIPTOR_ONLY | Replay dry-run descriptor v1 exists in memory only; no replay execution, replay UI or simulation exists yet. |
| `external-api` | NOT_IMPLEMENTED | No API endpoints exist yet. |
| `auth-security-runtime` | NOT_IMPLEMENTED | No auth platform or authorization middleware exists yet. |
| `tool-runtime` | NOT_IMPLEMENTED | No tool execution runtime exists yet. |
| `infrastructure` | NOT_IMPLEMENTED | No deployment/IaC exists yet. |
