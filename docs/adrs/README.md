# Architectural Decision Records

ADRs record approved architectural decisions for MYCELIA. They are required
when an implementation needs to deviate from, clarify, or extend canonical
architecture.

ADRs are not a place to bypass canonical documents. They must link to affected
MYCELIA documents and must be reviewed before implementation when the decision
changes behavior, contracts, security posture, tenancy, replay semantics,
governance, persistence, or integration boundaries.

When relevant, each ADR must include:

- affected MYCELIA documents;
- affected modules;
- security impact;
- tenant isolation impact;
- replay impact;
- governance and audit impact;
- data migration impact;
- API, event, tool, or schema contract impact;
- rollback plan;
- tests required.

Future Document 25 is expected to become the canonical ADR index. Until then,
this folder is the working ADR location.
