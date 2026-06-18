# MYCELIA Implementation Status

This status page captures repository truth after Phase 3I.

## Implemented Now

- Shared kernel and typed primitives.
- Runtime identity and request envelope contracts.
- Tenant boundary contracts.
- Policy/admission contracts.
- Runtime envelope contracts.
- Governed run descriptors/contracts.
- Runtime state and state transition contracts.
- Audit, investigation, replay and demo descriptor contracts.
- First static demo descriptor chain.
- Static product surfaces under App Router.
- Product surface index and product surface shell.
- Initial use case freeze for `Governed compliance/document review flow`.
- Pilot offer package for `Governed Operations Assessment` and `Governed Compliance Flow Pilot`.
- Runtime slice technical plan for the first minimal governed compliance/document review flow.
- Minimal persistent model scaffold for the first six runtime slice records.
- Minimal governed run lifecycle as pure in-memory transition logic.
- Policy/admission v1 as pure deterministic in-memory decision logic.
- Audit commit boundary as pure in-memory audit requirement classification.
- Approval gate v1 as pure deterministic in-memory approval decision logic.
- Investigation view model v1 as pure deterministic in-memory read-model assembly.
- Replay dry-run descriptor v1 as pure deterministic in-memory descriptor assembly.
- Internal runtime orchestrator v1 as pure deterministic in-memory descriptor composition.
- Runtime slice consistency audit for the 2R through 2Y minimal runtime slice.
- Minimal persistence activation as Prisma schema and migration contract for the six first-slice records.
- Runtime repository layer as an injected-client validation boundary for the six first-slice records.
- Prisma-like runtime repository adapter with injected client ownership.
- Persisted governed flow harness exercising low-risk, approval-pending, rejected and unsafe paths against disposable SQLite persistence.
- Approval + audit runtime slice deciding pending approvals, recording lifecycle snapshots and writing minimal `APPROVAL_DECIDED` audit records through the repository boundary.
- Persisted investigation read model reconstructing governed run history from repository-backed records into safe investigation descriptors.
- Minimal investigation UI surface rendering the persisted investigation read-model shape at `/mycelia/investigation` through a narrow live read-only loader.
- Investigation selection read-only boundary resolving controlled targets before rendering the investigation UI.
- Governed request creation surface rendering a controlled, non-mutating request seed preview at `/mycelia/request/new`.
- Approval decision UI surface rendering a controlled, non-mutating approval decision preview at `/mycelia/approval/decision`.

## Static/Demo-Only Now

- Home surface `/`.
- MYCELIA hub `/mycelia`.
- Executive narrative `/mycelia/executive`.
- Static demo `/mycelia/static-demo`.
- Walkthrough `/mycelia/walkthrough`.
- Request creation `/mycelia/request/new` with controlled non-mutating governed request seed preview.
- Approval decision `/mycelia/approval/decision` with controlled non-mutating approval decision preview.
- Roadmap `/mycelia/roadmap`.
- Investigation `/mycelia/investigation` with controlled read-only target selection and read-model loading.
- Product surface index.

These surfaces are static/read-only or controlled read-only, descriptor-level
and non-executing.

## Frozen Commercial Direction

The first buyer-oriented wedge is `Governed compliance/document review flow`.

The first commercial planning package defines:

- `Governed Operations Assessment`
- `Governed Compliance Flow Pilot`

Price ranges in the product docs are internal planning assumptions only. They
are not guaranteed pricing and should not be presented as buyer-facing
commitments.

## Not Implemented Yet

- Runtime execution.
- Workflow execution.
- Live governed request persistence and mutable runtime request creation.
- Live approval decision persistence and broad approval inbox/task management.
- Global PrismaClient bootstrapping in application source.
- Real policy engine beyond deterministic policy/admission v1.
- Real approval queue, approval UI and broad approval storage.
- Broad approval product, approval UI, RBAC and notification runtime.
- Broad audit writer, append log, audit sealing and export.
- Production investigation UI backed by a production read-only repository client and dynamic target source.
- Real replay execution.
- Real replay UI and replay runtime.
- Real internal runtime service boundary.
- API routes.
- Auth.
- External integrations.
- Production deployment.
- SaaS billing.
- Public SDK.

## Next Planning Direction

The minimal governed run lifecycle, policy/admission v1, audit commit boundary,
approval gate v1, investigation view model v1, replay dry-run descriptor v1 and
internal runtime orchestrator v1 provide pure in-memory decision, requirement,
read-model, replay planning and composition logic for the frozen governed
compliance/document review flow. Phase 3A adds the schema/migration contract
for the six first-slice records only. Phase 3B adds the injected-client
repository boundary without PrismaClient instantiation or runtime execution.
Phase 3C exercises that boundary through a persisted governed flow harness and
disposable SQLite tests. Phase 3D decides pending approvals and writes minimal
approval audit records through the same boundary. Phase 3E reconstructs
repository-backed run history into an investigation-ready read model. Phase 3F
renders that shape in a read-only UI surface. Phase 3G adds a controlled
investigation selection boundary so the route resolves a target before
rendering. Phase 3H adds a controlled request creation surface so the request
seed shape is visible before future live creation work. Phase 3I adds a
controlled approval decision preview so approval outcomes can be reviewed
visually before live decision actions exist. The next phase can move toward a
narrow connected demo path, but should not add broad API routes, auth, broad
policy engine, replay execution, broad approval inbox, workflow builder scope or
external integrations.
