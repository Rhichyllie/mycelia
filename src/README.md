# MYCELIA Source

Active MYCELIA source begins here.

## Implemented

- `src/mycelia/shared-kernel/`: shared TypeScript primitives for opaque IDs, classifications, Result helpers, safe errors and organizational runtime context.
- `src/mycelia/tenancy-boundaries/`: pure TypeScript tenant, workspace and project boundary scope/check primitives.
- `src/mycelia/runtime-identity/`: runtime identity, request origin, request envelope and identity denial primitives.
- `src/mycelia/event-envelope/`: EventEnvelope shape, mode, subject, payload descriptor, ordering hint, validation and denial primitives.
- `src/mycelia/policy-decision-gateway/`: policy action, resource, purpose, obligation, decision request, decision, denial and fail-closed check primitives.
- `src/mycelia/runtime-envelope/`: runtime propagation context, mode, scope, policy context, correlation, replay flag, validation and denial primitives.
- `src/mycelia/runtime-admission-gateway/`: pre-runtime admission request, decision, denial and fail-closed check primitives.
- `src/mycelia/governed-run/`: governed run shell status, origin, metadata, validation and fail-closed check primitives.
- `src/mycelia/runtime-state/`: runtime state kind, state descriptor, snapshot descriptor, validation and fail-closed check primitives.
- `src/mycelia/state-transition/`: state transition intent, rule, descriptor, result, validation and fail-closed check contracts.
- `src/mycelia/state-transition-coordinator/`: state transition coordination request, result, validation and fail-closed readiness skeleton.
- `src/mycelia/audit-record/`: audit actor, subject, evidence reference, audit record, validation and fail-closed descriptor contracts.
- `src/mycelia/audit-recorder/`: audit recording request, result, recorder, validation and fail-closed descriptor construction skeleton.
- `src/mycelia/audit-emission/`: audit emission intent, target, result, validation and fail-closed readiness descriptor contracts.
- `src/mycelia/audit-timeline/`: audit timeline entry, cursor, timeline, validation and fail-closed descriptor contracts.
- `src/mycelia/investigation-bundle/`: investigation bundle scope, item, summary, bundle, validation and fail-closed descriptor contracts.
- `src/mycelia/replay-plan/`: replay plan scope, step, plan, validation and fail-closed descriptor contracts.
- `src/mycelia/demo-scenario/`: demo scenario kind, step, link, scenario, validation and fail-closed descriptor contracts.
- `src/mycelia/demo-scenario-fixture/`: demo scenario fixture, fixture manifest, validation and fail-closed descriptor contracts.
- `src/mycelia/demo-readiness-report/`: demo readiness report status, finding, report, validation and fail-closed descriptor contracts.
- `src/mycelia/static-demo-artifact/`: static demo artifact kind, exposure, section, artifact, validation and fail-closed descriptor contracts.
- `src/mycelia/first-static-demo/`: first tracked static, non-executing MYCELIA demo descriptor set.
- `src/mycelia/static-demo-text-renderer/`: in-memory plain-text renderer contract for static demo artifact descriptors.
- `src/mycelia/human-readable-static-demo-preview/`: in-memory human-readable preview model for the first static demo.
- `src/mycelia/read-only-static-demo-page/`: read-only static demo product view module.
- `src/mycelia/home-entry-surface/`: static home entry surface model and view.
- `src/mycelia/product-information-surface/`: static MYCELIA product hub surface model and view.
- `src/mycelia/product-roadmap-surface/`: static product roadmap surface model and view.
- `src/mycelia/static-demo-walkthrough-surface/`: static guided walkthrough surface model and view.
- `src/mycelia/executive-narrative-surface/`: static executive narrative surface model and view.
- `src/mycelia/product-surface-shell/`: shared static product surface shell.
- `src/mycelia/product-surface-index/`: shared static product route catalog.
- `src/mycelia/initial-use-case-freeze/`: static Phase 2N buyer-oriented use case freeze.
- `src/mycelia/pilot-offer-package/`: static Phase 2O assessment and pilot offer planning package.
- `src/mycelia/runtime-slice-technical-plan/`: static Phase 2Q minimal runtime slice technical plan.
- `src/mycelia/runtime-persistence-model/`: static Phase 2R minimal persistent model scaffold.
- `src/mycelia/governed-run-lifecycle/`: pure Phase 2S in-memory governed run lifecycle transition logic.
- `src/mycelia/policy-admission-v1/`: pure Phase 2T deterministic policy/admission decision logic.
- `src/mycelia/audit-commit-boundary/`: pure Phase 2U audit commit requirement classification logic.
- `src/mycelia/approval-gate-v1/`: pure Phase 2V deterministic approval gate decision logic.
- `src/mycelia/investigation-view-model-v1/`: pure Phase 2W deterministic investigation view model assembly.
- `src/mycelia/replay-dry-run-descriptor-v1/`: pure Phase 2X deterministic replay dry-run descriptor assembly.
- `src/mycelia/internal-runtime-orchestrator-v1/`: pure Phase 2Y deterministic in-memory orchestration descriptor composition.
- `src/mycelia/runtime-slice-consistency-audit/`: static Phase 2Z consistency audit for the minimal runtime slice before Phase 3A.

## Not Implemented Yet

No `GovernedRun` execution, `RuntimeEnvelope` execution, real
policy engine beyond deterministic policy/admission v1, internal runtime service,
approval queue, approval UI, approval storage,
obligation execution, runtime admission side effects, real state transition
coordinator, state machine mutation,
next-state creation, checkpoint creation, audit storage, audit append log, audit
emission infrastructure, audit timeline storage, audit writing, real investigation UI,
investigation storage queries, case management, downloadable artifacts, static
artifact file generation, markdown file generation, PDF generation, JSON
fixture generation, demo export, demo execution, executable fixtures, demo seed
data, seed data, database pagination, timeline indexes, evidence store, record
sealing, signing, hash chaining, compliance export, observability pipeline,
event broker, event publishing, event persistence, queues, streams, webhooks,
files, canonical event catalog, replay execution, replay UI, replay runtime,
replay simulation, state
reconstruction, data hydration, tool calls, external service calls, active
persistence, active Prisma schema, API routes, workflow execution, authentication system,
authorization middleware, RLS, production deployment, SaaS billing or public SDK
exists yet.

Static product surfaces exist, but operational/runtime UI does not.

Legacy MapIA code must remain under `legacy/` and must not be copied back
without architecture review.
