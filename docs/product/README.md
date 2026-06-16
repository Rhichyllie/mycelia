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
- runtime execution, active persistence, API routes, auth and external integrations are not implemented yet.
