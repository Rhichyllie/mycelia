# Prisma Runtime Repository Adapter

Phase 3C defines a narrow Prisma-like adapter for the Phase 3B runtime
repository client.

The adapter accepts an injected client with Prisma-style model delegates. It
does not instantiate PrismaClient, create a global database client, connect to a
database at import time, run migrations, run Prisma generate, create API routes,
render UI, create auth, execute runtime, execute replay, emit events, write
audit records, call tools or call external services.

The adapter maps safe repository records to the six Phase 3A models:

- GovernedRun
- RuntimeStateSnapshot
- PolicyDecisionRecord
- AdmissionDecisionRecord
- ApprovalRequest
- AuditRecord

Phase 3D uses the adapter's injected approval-request update method to persist
approval decisions without changing the schema or instantiating PrismaClient in
production source.

Errors from the injected client are converted to generic adapter failures so
SQL text, stack traces and storage internals are not exposed.

This module exists to let tests and future runtime phases inject a concrete
database client without moving database ownership into the repository layer.
