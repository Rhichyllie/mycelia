# MYCELIA Source

Active MYCELIA source begins here.

## Implemented

- `src/mycelia/foundation/shared-kernel/`: shared TypeScript primitives for opaque IDs, classifications, Result helpers, safe errors and organizational runtime context.
- `src/mycelia/foundation/tenancy-boundaries/`: pure TypeScript tenant, workspace and project boundary scope/check primitives.
- `src/mycelia/foundation/runtime-identity/`: runtime identity, request origin, request envelope and identity denial primitives.
- `src/mycelia/foundation/event-envelope/`: EventEnvelope shape, mode, subject, payload descriptor, ordering hint, validation and denial primitives.
- `src/mycelia/domain-contracts/policy-decision-gateway/`: policy action, resource, purpose, obligation, decision request, decision, denial and fail-closed check primitives.
- `src/mycelia/foundation/runtime-envelope/`: runtime propagation context, mode, scope, policy context, correlation, replay flag, validation and denial primitives.
- `src/mycelia/domain-contracts/runtime-admission-gateway/`: pre-runtime admission request, decision, denial and fail-closed check primitives.
- `src/mycelia/domain-contracts/governed-run/`: governed run shell status, origin, metadata, validation and fail-closed check primitives.
- `src/mycelia/domain-contracts/runtime-state/`: runtime state kind, state descriptor, snapshot descriptor, validation and fail-closed check primitives.
- `src/mycelia/domain-contracts/state-transition/`: state transition intent, rule, descriptor, result, validation and fail-closed check contracts.
- `src/mycelia/domain-contracts/state-transition-coordinator/`: state transition coordination request, result, validation and fail-closed readiness skeleton.
- `src/mycelia/domain-contracts/audit-record/`: audit actor, subject, evidence reference, audit record, validation and fail-closed descriptor contracts.
- `src/mycelia/domain-contracts/audit-recorder/`: audit recording request, result, recorder, validation and fail-closed descriptor construction skeleton.
- `src/mycelia/domain-contracts/audit-emission/`: audit emission intent, target, result, validation and fail-closed readiness descriptor contracts.
- `src/mycelia/domain-contracts/audit-timeline/`: audit timeline entry, cursor, timeline, validation and fail-closed descriptor contracts.
- `src/mycelia/domain-contracts/investigation-bundle/`: investigation bundle scope, item, summary, bundle, validation and fail-closed descriptor contracts.
- `src/mycelia/domain-contracts/replay-plan/`: replay plan scope, step, plan, validation and fail-closed descriptor contracts.
- `src/mycelia/domain-contracts/demo-scenario/`: demo scenario kind, step, link, scenario, validation and fail-closed descriptor contracts.
- `src/mycelia/domain-contracts/demo-scenario-fixture/`: demo scenario fixture, fixture manifest, validation and fail-closed descriptor contracts.
- `src/mycelia/domain-contracts/demo-readiness-report/`: demo readiness report status, finding, report, validation and fail-closed descriptor contracts.
- `src/mycelia/domain-contracts/static-demo-artifact/`: static demo artifact kind, exposure, section, artifact, validation and fail-closed descriptor contracts.
- `src/mycelia/demo/first-static-demo/`: first tracked static, non-executing MYCELIA demo descriptor set.
- `src/mycelia/demo/static-demo-text-renderer/`: in-memory plain-text renderer contract for static demo artifact descriptors.
- `src/mycelia/demo/human-readable-static-demo-preview/`: in-memory human-readable preview model for the first static demo.
- `src/mycelia/ui-surfaces/read-only-static-demo-page/`: read-only static demo product view module.
- `src/mycelia/ui-surfaces/home-entry-surface/`: static home entry surface model and view.
- `src/mycelia/ui-surfaces/product-information-surface/`: static MYCELIA product hub surface model and view.
- `src/mycelia/ui-surfaces/product-roadmap-surface/`: static product roadmap surface model and view.
- `src/mycelia/ui-surfaces/static-demo-walkthrough-surface/`: static guided walkthrough surface model and view.
- `src/mycelia/ui-surfaces/executive-narrative-surface/`: static executive narrative surface model and view.
- `src/mycelia/ui-surfaces/product-surface-shell/`: shared static product surface shell.
- `src/mycelia/ui-surfaces/product-surface-index/`: shared static product route catalog.
- `src/mycelia/planning/initial-use-case-freeze/`: static Phase 2N buyer-oriented use case freeze.
- `src/mycelia/planning/pilot-offer-package/`: static Phase 2O assessment and pilot offer planning package.
- `src/mycelia/planning/runtime-slice-technical-plan/`: static Phase 2Q minimal runtime slice technical plan.
- `src/mycelia/persistence/runtime-persistence-model/`: static Phase 2R minimal persistent model scaffold.
- `src/mycelia/runtime-logic/governed-run-lifecycle/`: pure Phase 2S in-memory governed run lifecycle transition logic.
- `src/mycelia/runtime-logic/policy-admission-v1/`: pure Phase 2T deterministic policy/admission decision logic.
- `src/mycelia/runtime-logic/audit-commit-boundary/`: pure Phase 2U audit commit requirement classification logic.
- `src/mycelia/runtime-logic/approval-gate-v1/`: pure Phase 2V deterministic approval gate decision logic.
- `src/mycelia/runtime-logic/investigation-view-model-v1/`: pure Phase 2W deterministic investigation view model assembly.
- `src/mycelia/runtime-logic/replay-dry-run-descriptor-v1/`: pure Phase 2X deterministic replay dry-run descriptor assembly.
- `src/mycelia/runtime-logic/internal-runtime-orchestrator-v1/`: pure Phase 2Y deterministic in-memory orchestration descriptor composition.
- `src/mycelia/runtime-logic/runtime-slice-consistency-audit/`: static Phase 2Z consistency audit for the minimal runtime slice before Phase 3A.
- `src/mycelia/persistence/minimal-persistence-activation/`: static Phase 3A descriptor for the Prisma schema/migration contract.
- `src/mycelia/persistence/runtime-repository-layer/`: Phase 3B injected-client repository boundary for the six first-slice records.
- `src/mycelia/persistence/prisma-runtime-repository-adapter/`: Phase 3C injected Prisma-like adapter for the repository boundary.
- `src/mycelia/persistence/persisted-governed-flow-harness/`: Phase 3C controlled persisted governed flow harness for local persistence tests.
- `src/mycelia/persistence/approval-audit-runtime-slice/`: Phase 3D persisted approval decision and minimal approval audit runtime slice.
- `src/mycelia/persistence/persisted-investigation-read-model/`: Phase 3E persisted investigation read model over repository-backed records.
- `src/mycelia/ui-surfaces/minimal-investigation-ui-surface/`: Phase 3F read-only investigation UI surface with persisted read-model loader.
- `src/mycelia/ui-surfaces/investigation-selection-readonly-boundary/`: Phase 3G controlled investigation target selection boundary for read-only UI rendering.
- `src/mycelia/ui-surfaces/governed-request-creation-surface/`: Phase 3H controlled non-mutating governed request seed preview surface.
- `src/mycelia/ui-surfaces/approval-decision-ui-surface/`: Phase 3I controlled non-mutating approval decision preview surface.
- `src/mycelia/demo/demo-scenario-seed-package/`: Phase 3J deterministic non-executing demo scenario seed package connecting request, approval and investigation surfaces.
- `src/mycelia/demo/pilot-demo-end-to-end/`: Phase 3K controlled non-executing pilot demo walkthrough over deterministic scenario seeds, hardened in Phase 3L as a guided customer pilot route.
- `src/mycelia/demo/demo-local-preview/`: Phase 3L descriptive local preview contract for controlled demo inspection.

## Not Implemented Yet

No `GovernedRun` execution, `RuntimeEnvelope` execution, real
policy engine beyond deterministic policy/admission v1, internal runtime service,
approval queue, approval UI, broad approval product storage,
RBAC, notification runtime,
obligation execution, runtime admission side effects, real state transition
coordinator, state machine mutation,
next-state creation, checkpoint creation, audit storage, audit append log, audit
emission infrastructure, audit timeline storage, audit writing, production dynamic investigation UI beyond controlled read-only selection,
case management, downloadable artifacts, static
artifact file generation, markdown file generation, PDF generation, JSON
fixture generation, demo export, demo execution, executable fixtures, demo seed
data, seed data, database pagination, timeline indexes, evidence store, record
sealing, signing, hash chaining, compliance export, observability pipeline,
event broker, event publishing, event persistence, queues, streams, webhooks,
files, canonical event catalog, replay execution, replay UI, replay runtime,
replay simulation, state
reconstruction, data hydration, tool calls, external service calls,
global PrismaClient bootstrapping, live governed request/approval persistence, full runtime product surface, API routes,
live demo seed execution,
workflow execution, authentication system,
authorization middleware, RLS, production deployment, SaaS billing or public SDK
exists yet.

Static product surfaces, controlled read-only investigation selection,
controlled request creation preview, controlled approval decision preview,
deterministic demo scenario seeds, a controlled pilot walkthrough and a
local-only demo preview command exist, but mutable operational/runtime UI does
not.

Legacy MapIA code must remain under `legacy/` and must not be copied back
without architecture review.
