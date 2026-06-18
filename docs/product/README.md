# MYCELIA Product Decisions

This directory contains static, read-only product decision artifacts for MYCELIA.
They are internal planning artifacts, not runtime implementation, not mature
SaaS readiness and not customer-facing guaranteed pricing.

These documents do not execute runtime work, persist data, call APIs, call tools, call external services, export files, generate PDFs or create downloadable artifacts.

Current product decision artifacts:

- [Initial Use Case Freeze](initial-use-case-freeze.md): freezes the first buyer-oriented wedge, `Governed compliance/document review flow`.
- [Pilot Offer and Discovery Package](pilot-offer-package.md): defines the internal `Governed Operations Assessment` and `Governed Compliance Flow Pilot` planning package.
- [Runtime Slice Technical Plan](runtime-slice-technical-plan.md): defines the smallest planned runtime slice for the frozen use case without implementing runtime or persistence.
- [Minimal Persistent Model Scaffold](minimal-persistent-model-scaffold.md): defines the first six persistence record shapes without database access, migrations or active persistence.
- [Minimal Governed Run Lifecycle](minimal-governed-run-lifecycle.md): defines pure in-memory lifecycle transition logic without runtime execution, persistence, events or audit writing.
- [Policy/Admission v1](policy-admission-v1.md): defines deterministic in-memory policy/admission decisions without runtime execution, persistence, approval queues or audit writing.
- [Audit Commit Boundary](audit-commit-boundary.md): defines in-memory audit requirement classification without audit writing, event emission, persistence or export.
- [Approval Gate v1](approval-gate-v1.md): defines deterministic in-memory approval decision handling without approval UI, persistence, audit writing or event emission.
- [Investigation View Model v1](investigation-view-model-v1.md): defines deterministic in-memory investigation view assembly without UI, database reads, persistence, audit writing or event emission.
- [Replay Dry-Run Descriptor v1](replay-dry-run-descriptor-v1.md): defines deterministic in-memory replay dry-run descriptors without replay execution, tools, external calls, persistence or event emission.
- [Internal Runtime Orchestrator v1](internal-runtime-orchestrator-v1.md): composes the pure runtime-slice layers into one deterministic in-memory descriptor flow without runtime execution, persistence, APIs or external calls.
- [Runtime Slice Consistency Audit](runtime-slice-consistency-audit.md): audits the 2R-2Y runtime slice and recommends narrow Phase 3A persistence activation without runtime execution.
- [Minimal Persistence Activation](minimal-persistence-activation.md): activates the Prisma schema and migration contract for the six first-slice records without application DB reads/writes.
- [Runtime Repository Layer](runtime-repository-layer.md): defines an injected-client repository boundary for the six first-slice records without PrismaClient instantiation, API routes or runtime execution.
- [Persisted Governed Flow Harness](persisted-governed-flow-harness.md): exercises the schema, repository boundary and deterministic governed flow paths against disposable SQLite persistence without API, UI, auth or SaaS scope.
- [Approval + Audit Runtime Slice](approval-audit-runtime-slice.md): decides persisted pending approval requests, records lifecycle snapshots and writes minimal `APPROVAL_DECIDED` audit records without API, UI, auth, replay execution or event emission.
- [Persisted Investigation Read Model](persisted-investigation-read-model.md): reconstructs persisted run history into an investigation-ready descriptor without UI, API, auth, replay execution or export behavior.
- [Minimal Investigation UI Surface](minimal-investigation-ui-surface.md): renders the persisted investigation read-model shape through a narrow live read-only loader without API, auth, replay, mutation or export behavior.
- [Investigation Selection & Read-Only Boundary](investigation-selection-readonly-boundary.md): resolves controlled investigation targets before rendering without mutation, broad search, API, auth, replay or export behavior.
- [Governed Request Creation Surface](governed-request-creation-surface.md): renders a controlled non-mutating request seed preview at `/mycelia/request/new` without persistence writes, API, auth, replay, export or workflow builder scope.

Current truth:

- contracts and descriptor primitives exist;
- static product surfaces exist;
- the first buyer-oriented use case is frozen;
- the first assessment/pilot package exists;
- the minimal runtime slice technical plan exists;
- the minimal persistent model scaffold exists;
- the minimal governed run lifecycle exists as pure TypeScript in-memory transition logic;
- policy/admission v1 exists as pure TypeScript deterministic decision logic;
- the audit commit boundary exists as pure TypeScript audit requirement classification;
- approval gate v1 exists as pure TypeScript deterministic decision logic;
- investigation view model v1 exists as pure TypeScript deterministic read-model assembly;
- replay dry-run descriptor v1 exists as pure TypeScript deterministic descriptor assembly;
- internal runtime orchestrator v1 exists as pure TypeScript deterministic in-memory descriptor composition;
- runtime slice consistency audit exists as a static descriptor-level GREEN audit for Phase 3A readiness;
- minimal persistence activation exists as schema/migration contract only;
- runtime repository layer exists as an injected-client validation boundary;
- persisted governed flow harness exists for controlled local persistence tests;
- approval + audit runtime slice exists for persisted approval decisions and minimal approval audit records;
- persisted investigation read model exists for repository-backed reconstruction;
- minimal investigation UI surface exists with a narrow live read-only read-model loader;
- investigation selection read-only boundary exists for controlled target resolution;
- governed request creation surface exists as a controlled non-mutating draft preview;
- runtime product execution, live request persistence, API routes, auth, global PrismaClient bootstrapping, broad approval UI, production dynamic investigation UI beyond controlled read-only selection, broad audit service and external integrations are not implemented yet.
