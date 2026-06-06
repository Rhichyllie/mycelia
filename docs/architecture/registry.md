# MYCELIA Architecture Registry

This registry maps architecture domains to owning documents and planned
implementation surfaces. It is an alignment scaffold only.

| Domain | Owning Document | Implementation Status | Future Module/Package | Notes |
|---|---|---|---|---|
| Vision/Product Scope | 00, 01 | DOCUMENTED_NOT_IMPLEMENTED | `docs-only` | Product and doctrine authority. |
| Core Runtime | 02 | DOCUMENTED_NOT_IMPLEMENTED | `core-runtime` | No runtime kernel exists yet. |
| Domain Model | 03 | DOCUMENTED_NOT_IMPLEMENTED | `domain-model` | Future schemas must derive from Document 03. |
| Cognitive Execution | 04 | DOCUMENTED_NOT_IMPLEMENTED | `cognitive-execution` | No model invocation runtime exists yet. |
| Agent Runtime | 05 | DOCUMENTED_NOT_IMPLEMENTED | `agent-runtime` | No agent coordination runtime exists yet. |
| State/Persistence | 06 | DOCUMENTED_NOT_IMPLEMENTED | `state-persistence` | No Prisma schema or migrations exist in active surface. |
| Event Contracts | 07 | DOCUMENTED_NOT_IMPLEMENTED | `event-contracts` | Contract registry placeholders only. |
| Event Runtime | 08 | DOCUMENTED_NOT_IMPLEMENTED | `event-runtime` | No broker/outbox implementation exists yet. |
| Workflow Orchestration | 09 | DOCUMENTED_NOT_IMPLEMENTED | `workflow-orchestration` | No workflow engine exists yet. |
| Memory/Context | 10 | DOCUMENTED_NOT_IMPLEMENTED | `memory-context` | No memory store or context assembly exists yet. |
| Governance/Policy/Approval | 11 | DOCUMENTED_NOT_IMPLEMENTED | `governance-policy` | No policy gateway or approval engine exists yet. |
| Observability/Telemetry | 12 | DOCUMENTED_NOT_IMPLEMENTED | `observability-telemetry` | No active semantic convention registry exists yet. |
| Security/Trust | 13 | DOCUMENTED_NOT_IMPLEMENTED | `security-trust` | No active trust fabric exists yet. |
| Tenancy/Boundaries | 14 | DOCUMENTED_NOT_IMPLEMENTED | `tenancy-boundaries` | No active tenant resolver/RLS implementation exists yet. |
| SDK/Tool Runtime | 15 | DOCUMENTED_NOT_IMPLEMENTED | `tool-runtime` | No tool manifests or execution contracts exist yet. |
| Infrastructure/Deployment | 16 | DOCUMENTED_NOT_IMPLEMENTED | `infrastructure` | No IaC or deployment implementation exists yet. |
| SRE/Recovery | 17 | DOCUMENTED_NOT_IMPLEMENTED | `sre-runbooks` | No active runbooks exist yet. |
| External APIs/Integrations | 18 | DOCUMENTED_NOT_IMPLEMENTED | `external-api` | No API endpoints or integration contracts exist yet. |
| Codex Alignment | 19 | DOCUMENTED_NOT_IMPLEMENTED | `test-harness`, `contract-tests` | Governs Codex execution and evidence. |
| Operational UX | 20 if present, otherwise planned | DOCUMENTED_NOT_IMPLEMENTED | `operational-ux` | UX architecture only; no UI implementation exists yet. |
| Workflow Builder | Document 21 planned | DOCUMENTED_NOT_IMPLEMENTED | `workflow-builder` | Planned future domain. |
| Investigation/Replay UX | Document 22 planned | DOCUMENTED_NOT_IMPLEMENTED | `investigation-replay-ux` | Planned future domain. |
| Evaluation/Benchmark | Document 23 planned | DOCUMENTED_NOT_IMPLEMENTED | `evaluation-benchmark` | Planned future domain. |
| Enterprise Scaling | Document 24 planned | DOCUMENTED_NOT_IMPLEMENTED | `enterprise-scaling` | Planned future domain. |
| ADR Index | Document 25 planned | DOCUMENTED_NOT_IMPLEMENTED | `docs/adrs` | ADR files live under `docs/adrs/` until Document 25 exists. |
