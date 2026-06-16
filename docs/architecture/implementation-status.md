# MYCELIA Implementation Status

This status page captures repository truth after Phase 2T.

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

## Static/Demo-Only Now

- Home surface `/`.
- MYCELIA hub `/mycelia`.
- Executive narrative `/mycelia/executive`.
- Static demo `/mycelia/static-demo`.
- Walkthrough `/mycelia/walkthrough`.
- Roadmap `/mycelia/roadmap`.
- Product surface index.

These surfaces are static, read-only, descriptor-level and non-executing.

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
- Active persistence.
- Database-backed governed runs.
- Real policy engine beyond deterministic policy/admission v1.
- Real approval queue.
- Real audit commit boundary.
- Real investigation view.
- Real replay execution.
- API routes.
- Auth.
- External integrations.
- Production deployment.
- SaaS billing.
- Public SDK.

## Next Planning Direction

The minimal governed run lifecycle and policy/admission v1 now provide pure
in-memory decision logic for the frozen governed compliance/document review
flow. The next implementation phase should remain conservative: define the
audit commit boundary before any API routes, auth, approval queue, broad policy
engine, investigation view, replay execution or active persistence is activated.
