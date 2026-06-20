# MYCELIA Architecture Document Index

This folder contains the canonical MYCELIA architecture series. Documents 00-19
are the current implementation authority for Phase 0 work.

## Foundation

| Document | Title | Status |
|---|---|---|
| 00 | Vision & Foundational Manifesto | Present |
| 01 | Product Requirements & Operational Scope | Present |
| 02 | Core Runtime Architecture | Present |
| 03 | Canonical Domain Model | Present |

## Orchestration Layer

| Document | Title | Status |
|---|---|---|
| 06 | State, Checkpoint & Persistence Architecture | Present |
| 07 | Event & Messaging Contracts | Present |
| 08 | Event Runtime Deep Technical Specification | Present |
| 09 | Workflow Orchestration Engine Specification | Present |
| 10 | Memory & Context Architecture | Present |
| 11 | Governance, Policy & Approval Engine | Present |
| 12 | Observability & Telemetry Platform | Present |
| 13 | Security & Trust Architecture | Present |
| 14 | Multi-Tenant Isolation & Organizational Boundaries | Present |

## Execution & Tooling

| Document | Title | Status |
|---|---|---|
| 04 | Cognitive Execution Model | Present |
| 05 | Agent Runtime & Coordination | Present |
| 15 | SDK, Tool Runtime & Execution Contracts | Present |
| 16 | Infrastructure & Deployment Architecture | Present |
| 17 | SRE, Operational Recovery & Runbooks | Present |
| 18 | External APIs & Integration Contracts | Present |

## Codex Brain

| Document | Title | Status |
|---|---|---|
| 19 | Codex Operational Alignment & Engineering Constitution | Present |

## Future Documents

Documents 20-26 are now present in this folder as forward-looking architecture
context. They are not active implementation authority for Phase 0 work:
Documents 00-19 remain the current implementation authority. Document 20
(Operational UX & Runtime Visualization System) and Document 22
(Investigation Mode, Replay & Runtime Diff UX) describe domains where narrow,
read-only slices already exist in `src/mycelia/ui-surfaces/` and
`src/mycelia/persistence/persisted-investigation-read-model/`; the documents
describe the target system, not the current narrow slice. Documents 21
(Workflow Builder), 23 (Evaluation/Benchmark), and 24 (Enterprise Scaling)
describe domains with no implementation yet. Document 25 indexes
architectural decision records under `docs/adrs/`. Document 26 specifies the
visual identity and product design system; no design tokens or components
from it are wired into `app/` yet.
