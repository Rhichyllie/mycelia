# Proposed Future Module Map

This module map is a planning scaffold only. It does not create packages,
source files, runtime behavior, APIs, migrations, or schemas.

| Module | Owning Document | Allowed Responsibilities | Forbidden Responsibilities | Status | Future Location Placeholder |
|---|---|---|---|---|---|
| `shared-kernel` | 02, 03 | Shared identifiers, value object conventions, error categories. | Importing application modules or infrastructure clients. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `core-runtime` | 02 | Runtime kernel boundaries, runtime pipeline coordination. | Direct tool execution, direct external API calls, hidden state. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `domain-model` | 03 | Canonical entities, field rules, domain invariants. | Persistence adapters, HTTP handlers, model/provider calls. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `state-persistence` | 06 | Durable state records, checkpoints, transition persistence rules. | Creating unowned lifecycle states or bypassing state coordination. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `event-contracts` | 07 | Event envelope schemas, catalog registry, compatibility rules. | Publishing events or inventing unregistered event names. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `event-runtime` | 08 | Broker/outbox runtime mechanics and delivery operations. | Defining canonical event semantics outside Document 07. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `workflow-orchestration` | 09 | Deterministic workflow control flow and scheduling decisions. | Calling model providers, tools, external APIs, or worker sleeps. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `cognitive-execution` | 04 | Bounded cognitive invocation contracts and output promotion boundaries. | Owning workflow state or bypassing governance. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `agent-runtime` | 05 | Agent participant boundaries, coordination, handoff contracts. | Granting agents direct tool authority or credentials. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `memory-context` | 10 | Memory object contracts, retrieval policy surfaces, context assembly. | Treating raw prompt history as authoritative memory. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `governance-policy` | 11 | Policy decisions, approval contracts, governance evidence surfaces. | Fail-open authorization or informal approval states. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `observability-telemetry` | 12 | Telemetry conventions, traces, metrics, logs, redaction guidance. | Acting as audit source of truth or governance decision maker. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `security-trust` | 13 | Trust boundaries, identity, credential references, security evidence. | Storing raw secrets or bypassing policy evaluation. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `tenancy-boundaries` | 14 | Tenant resolution, boundary snapshots, isolation helpers. | Allowing tenantless runtime operations. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `tool-runtime` | 15 | Tool registry, execution contracts, side-effect boundaries. | Letting agents or APIs invoke tools directly. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `external-api` | 18 | External request envelopes, API contract surfaces, integration intent. | Direct runtime mutation or external side effects outside gateways. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `infrastructure` | 16 | IaC, deployment topology, environment boundaries. | Embedding secrets or weakening tenant isolation. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `sre-runbooks` | 17 | Operational recovery procedures and incident guidance. | Recovery actions that mutate lineage or replay live side effects. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `operational-ux` | 20 if present, otherwise planned | Runtime visualization and operational UX planning. | Creating product UI before runtime contracts exist. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
| `test-harness` | 19 | Future tenant, replay, contract, and safety test utilities. | Tests that encode MapIA behavior as MYCELIA acceptance criteria. | PLANNED_NOT_IMPLEMENTED | TBD after package baseline. |
