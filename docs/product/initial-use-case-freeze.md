# Initial Use Case Freeze

Phase 2N freezes the first commercially useful MYCELIA use case as governed compliance/document review flow.

Plain-language framing: a sensitive operational request enters the system. MYCELIA frames the request, resolves identity and context, applies policy and admission, requires human approval when risk requires it, records an audit trail, enables investigation and prepares a replay dry-run without executing unsafe side effects.

## Buyer and ICP

Primary buyer personas:

- Head of Operations
- Compliance/Risk leader
- Legal Operations leader
- Digital Transformation leader

First ICP:

- regulated backoffice
- document-heavy operations
- compliance-sensitive workflows
- banks, insurers, legal operations, financial operations or regulated service operations

Explicit non-ICP for now:

- generic chatbot buyers
- broad workflow automation buyers
- pure developer tooling buyers
- teams wanting fully autonomous agents with no human approval

## Frozen Flow

1. Sensitive request intake
2. Identity/context resolution
3. Tenant/context boundary check
4. Risk/policy classification
5. Runtime admission decision
6. Human approval if required
7. Governed run state transition
8. Audit record creation
9. Investigation view preparation
10. Replay dry-run plan without side effects

## First Runtime Slice

In scope:

- one request type
- one deterministic policy/risk classifier
- one admission decision flow
- one human approval gate
- one state lifecycle
- one audit trail
- one investigation view
- one replay dry-run descriptor
- one fake or local adapter only if needed later, with no external side effects in this phase

Out of scope:

- workflow builder
- public API
- SaaS billing
- full auth platform
- full multi-tenant enterprise isolation
- general-purpose agent orchestration
- multiple integrations
- SDK
- white-label
- benchmark framework
- advanced observability
- real replay execution
- autonomous side effects

## Commercial Offer

Assessment and blueprint package:

- Recommended duration: 2 to 3 weeks
- Internal planning range: R$ 15k to R$ 35k
- Buyer-facing deliverables: use-case map, governance gap analysis, policy/admission blueprint, approval gate design, audit and investigation readiness plan, runtime slice implementation plan

Pilot package:

- Recommended duration: 6 to 10 weeks
- Internal planning range: R$ 80k to R$ 180k
- Buyer-facing deliverables: single governed request flow, deterministic policy/admission v1, human approval gate, governed run lifecycle, audit trail, investigation view, replay dry-run descriptor

These BRL ranges are internal planning assumptions only. They are not guaranteed pricing and should not be presented as buyer-facing commitments.

## Safety Boundary

This phase does not execute the use case, persist data, call APIs, call external services, create auth, create runtime, export files, generate PDFs or create downloadable artifacts. It only freezes the first buyer-oriented use case and runtime direction.
