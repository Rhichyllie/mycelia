# MYCELIA Architecture Registry

This registry maps architecture domains to owning documents and current
implementation truth. It is an alignment scaffold only. It does not grant
permission to claim runtime, persistence, API, auth, deployment or SaaS
readiness.

| Domain | Owning Document | Current Status | Active Surface | Notes |
|---|---|---|---|---|
| Vision/Product Scope | 00, 01 | PRODUCT_DIRECTION_FROZEN_PARTIAL | `docs/product/`, `src/mycelia/initial-use-case-freeze/`, `src/mycelia/pilot-offer-package/`, `src/mycelia/runtime-slice-technical-plan/` | First use case, pilot offer and runtime slice plan are internal planning artifacts. |
| Core Runtime | 02 | CONTRACTS_PLAN_AND_PURE_LIFECYCLE_ONLY_RUNTIME_NOT_IMPLEMENTED | `src/mycelia/runtime-envelope/`, `src/mycelia/runtime-admission-gateway/`, `src/mycelia/governed-run/`, `src/mycelia/runtime-slice-technical-plan/`, `src/mycelia/governed-run-lifecycle/` | Runtime slice technical plan and pure lifecycle transition logic exist; no runtime kernel or execution pipeline exists yet. |
| Domain Model | 03 | DESCRIPTOR_CONTRACTS_AND_PERSISTENCE_SCAFFOLD_IMPLEMENTED_PARTIAL | `src/mycelia/*` descriptor modules, `src/mycelia/runtime-persistence-model/` | Current source defines typed descriptors and a minimal persistence scaffold, not active persistence. |
| Cognitive Execution | 04 | DOCUMENTED_NOT_IMPLEMENTED | future `cognitive-execution` | No model invocation runtime exists yet. |
| Agent Runtime | 05 | DOCUMENTED_NOT_IMPLEMENTED | future `agent-runtime` | No agent coordination runtime exists yet. |
| State/Persistence | 06 | STATE_CONTRACTS_LIFECYCLE_AND_MODEL_SCAFFOLD_IMPLEMENTED_PERSISTENCE_NOT_ACTIVE | `src/mycelia/runtime-state/`, `src/mycelia/state-transition/`, `src/mycelia/state-transition-coordinator/`, `src/mycelia/runtime-persistence-model/`, `src/mycelia/governed-run-lifecycle/` | Minimal persistence record scaffold and pure lifecycle logic exist; no database-backed state or checkpoints exist yet. |
| Event Contracts | 07 | EVENT_ENVELOPE_CONTRACT_IMPLEMENTED_CATALOG_NOT_IMPLEMENTED | `src/mycelia/event-envelope/` | No broker, event store or canonical event catalog exists yet. |
| Event Runtime | 08 | DOCUMENTED_NOT_IMPLEMENTED | future `event-runtime` | No broker, outbox or event publishing exists yet. |
| Workflow Orchestration | 09 | DOCUMENTED_NOT_IMPLEMENTED | future `workflow-orchestration` | No workflow engine exists yet. |
| Memory/Context | 10 | DOCUMENTED_NOT_IMPLEMENTED | future `memory-context` | No memory store or context assembly runtime exists yet. |
| Governance/Policy/Approval | 11 | POLICY_ADMISSION_AND_APPROVAL_GATE_PURE_V1_IMPLEMENTED_APPROVAL_ENGINE_NOT_IMPLEMENTED | `src/mycelia/policy-decision-gateway/`, `src/mycelia/runtime-admission-gateway/`, `src/mycelia/policy-admission-v1/`, `src/mycelia/approval-gate-v1/` | Deterministic policy/admission v1 and approval gate v1 exist in memory only; no real policy engine, approval queue, approval UI or admission side effects exist yet. |
| Observability/Telemetry | 12 | AUDIT_DESCRIPTOR_CONTRACTS_AND_PURE_COMMIT_BOUNDARY_IMPLEMENTED_TELEMETRY_NOT_IMPLEMENTED | `src/mycelia/audit-record/`, `src/mycelia/audit-recorder/`, `src/mycelia/audit-emission/`, `src/mycelia/audit-timeline/`, `src/mycelia/audit-commit-boundary/` | Pure audit commit boundary exists; no audit writer, append log, audit storage or observability pipeline exists yet. |
| Security/Trust | 13 | DOCUMENTED_NOT_IMPLEMENTED | future `security-trust` | No active trust fabric, auth or authorization middleware exists yet. |
| Tenancy/Boundaries | 14 | BOUNDARY_CONTRACTS_IMPLEMENTED_RESOLVER_RLS_NOT_IMPLEMENTED | `src/mycelia/tenancy-boundaries/` | No tenant resolver, RLS or enterprise isolation runtime exists yet. |
| SDK/Tool Runtime | 15 | DOCUMENTED_NOT_IMPLEMENTED | future `tool-runtime` | No tool manifests or tool execution contracts exist yet. |
| Infrastructure/Deployment | 16 | DOCUMENTED_NOT_IMPLEMENTED | future `infrastructure` | No IaC, deployment or production environment exists yet. |
| SRE/Recovery | 17 | DOCUMENTED_NOT_IMPLEMENTED | future `sre-runbooks` | No active runbooks exist yet. |
| External APIs/Integrations | 18 | DOCUMENTED_NOT_IMPLEMENTED | future `external-api` | No API endpoints or external integrations exist yet. |
| Codex Alignment | 19 | VALIDATION_BASELINE_IMPLEMENTED | `scripts/`, `pnpm validate:phase0` | Validation remains the safe repository gate. |
| Static Product Surfaces | 00, 01, 19 | STATIC_READ_ONLY_IMPLEMENTED | `app/`, `src/mycelia/*-surface/`, `src/mycelia/product-surface-index/` | Routes are static, descriptor-level and non-executing. |
| Static Demo Descriptor Chain | 00, 01, 02, 03, 19 | STATIC_DESCRIPTOR_CHAIN_IMPLEMENTED | `src/mycelia/first-static-demo/`, `src/mycelia/static-demo-text-renderer/`, `src/mycelia/human-readable-static-demo-preview/` | Demo is in-memory/static only; no export or runtime execution. |
| Product/Commercial Planning | 00, 01, 19 | INTERNAL_PLANNING_AND_PURE_RUNTIME_SLICE_LAYERS_IMPLEMENTED | `docs/product/`, `src/mycelia/initial-use-case-freeze/`, `src/mycelia/pilot-offer-package/`, `src/mycelia/runtime-slice-technical-plan/`, `src/mycelia/governed-run-lifecycle/`, `src/mycelia/policy-admission-v1/`, `src/mycelia/audit-commit-boundary/`, `src/mycelia/approval-gate-v1/`, `src/mycelia/investigation-view-model-v1/` | Pricing ranges are internal planning assumptions, not guarantees; lifecycle, policy/admission v1, audit commit boundary, approval gate v1 and investigation view model v1 are pure in-memory logic only. |
| Operational UX | planned | STATIC_PRODUCT_SURFACES_ONLY | `app/`, `src/mycelia/*-surface/` | Runtime UX, investigation UX and workflow builder UX are not implemented. |
| Workflow Builder | planned | NOT_IMPLEMENTED | future `workflow-builder` | Planned future domain. |
| Investigation/Replay UX | planned | PURE_INVESTIGATION_MODEL_ONLY | `src/mycelia/investigation-view-model-v1/`, future `investigation-replay-ux` | Static walkthrough and pure investigation view model exist; real investigation/replay UX, database reads and replay execution do not. |
| Evaluation/Benchmark | planned | NOT_IMPLEMENTED | future `evaluation-benchmark` | Planned future domain. |
| Enterprise Scaling | planned | NOT_IMPLEMENTED | future `enterprise-scaling` | Planned future domain. |
| ADR Index | planned | NOT_IMPLEMENTED | `docs/adrs` | ADR files live under `docs/adrs/` until an ADR index exists. |
