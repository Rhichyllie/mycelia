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

Current truth:

- contracts and descriptor primitives exist;
- static product surfaces exist;
- the first buyer-oriented use case is frozen;
- the first assessment/pilot package exists;
- the minimal runtime slice technical plan exists;
- the minimal persistent model scaffold exists;
- runtime execution, active persistence, API routes, auth and external integrations are not implemented yet.
