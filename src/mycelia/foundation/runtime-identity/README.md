# MYCELIA Runtime Identity

This module contains the Phase 1C runtime identity and request envelope
skeleton.

It provides pure TypeScript primitives for:

- runtime execution identity;
- human and service actor identity shapes;
- request origin classification;
- typed request envelopes;
- deterministic identity checks;
- safe identity denial results.

This module is a foundation for future runtime, API, policy, and event layers.
It is not authentication, authorization, session management, RBAC, API
middleware, EventEnvelope, RuntimeEnvelope execution, GovernedRun, persistence,
or database Row-Level Security.

The module depends on `src/mycelia/foundation/shared-kernel/` for opaque identifiers,
classification, and Result helpers, and on `src/mycelia/foundation/tenancy-boundaries/`
for organizational scope validation. It follows Documents 02, 03, 13, 14, and
19: tenant identity is mandatory, runtime identity and actor identity are
distinct, replay/test origins are explicit, and no secret or human-readable
business identifier belongs in these primitives.
