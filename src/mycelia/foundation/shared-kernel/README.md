# MYCELIA Shared Kernel

This folder contains the first active MYCELIA TypeScript primitives.

Phase 1A scope is intentionally narrow:

- opaque canonical identifier types and schemas;
- data classification primitives;
- small Result helpers;
- safe error primitives;
- a typed OrganizationalRuntimeContext.

This folder does not implement the MYCELIA runtime, GovernedRun lifecycle,
EventEnvelope, state machines, persistence, APIs, Prisma schema, migrations, or
UI behavior. retired source-derived code must not be copied into this module without
architecture review.
