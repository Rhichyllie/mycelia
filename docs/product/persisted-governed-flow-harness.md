# Persisted Governed Flow Harness

Phase 3C creates the first controlled persisted governed flow harness for the
governed compliance/document review slice.

This phase intentionally combines the Prisma-like adapter boundary with a
minimal governed flow. That prevents an adapter-only layer from becoming
isolated infrastructure with no behavior. The harness proves that the Phase 3A
schema and Phase 3B repository boundary can support real local persistence for
the first governed flow paths.

## What 3C Adds

Phase 3C adds:

- a Prisma-like runtime repository adapter with injected client ownership;
- a persisted governed flow harness using the Phase 3B repository layer;
- disposable SQLite test coverage that applies the Phase 3A migration SQL;
- deterministic low-risk, medium-risk, high-risk and unsafe-input scenarios;
- persisted readback through the repository layer;
- safe reconstructed persisted-flow descriptors.

It does not instantiate PrismaClient globally, run production migrations,
create API routes, create UI, create auth, execute replay, call external
services, call tools, create billing, create Postgres support or revive MapIA.

## Records Persisted

The harness writes and reads back the six Phase 3A records:

- GovernedRun
- RuntimeStateSnapshot
- PolicyDecisionRecord
- AdmissionDecisionRecord
- ApprovalRequest when policy/admission requires approval
- AuditRecord for minimal request/admission boundaries

Records use safe references and summaries only. Raw sensitive document content,
raw payloads, file blobs, binary content, uploaded file bodies and raw external
service responses remain excluded.

## Scenario Coverage

Low-risk completed path:

- creates a GovernedRun;
- creates RuntimeStateSnapshot records through `COMPLETED`;
- creates PolicyDecisionRecord and AdmissionDecisionRecord;
- creates minimal AuditRecord entries for request creation and admission
  decision;
- reads records back and returns `PERSISTED_COMPLETED`.

Medium-risk approval-required path:

- creates a GovernedRun;
- creates RuntimeStateSnapshot records through `WAITING_APPROVAL`;
- creates PolicyDecisionRecord and AdmissionDecisionRecord;
- creates an ApprovalRequest with `PENDING` status;
- creates minimal AuditRecord entries;
- reads records back and returns `PERSISTED_WAITING_APPROVAL`.

High-risk rejected path:

- creates a GovernedRun;
- creates RuntimeStateSnapshot records through `REJECTED`;
- creates PolicyDecisionRecord and AdmissionDecisionRecord;
- creates minimal AuditRecord entries;
- reads records back and returns `PERSISTED_REJECTED`.

Unsafe input path:

- fails closed before persistence;
- does not write unsafe records;
- does not leak raw input.

## Adapter Boundary

`src/mycelia/prisma-runtime-repository-adapter/` accepts an injected
Prisma-like client. It implements the Phase 3B structural repository client
methods and maps returned records to safe descriptors.

The adapter does not instantiate PrismaClient, create global clients, connect
at import time, infer cross-tenant state, leak SQL errors or expose raw storage
messages.

## Disposable Database Testing

Tests apply `prisma/migrations/000001_minimal_runtime_slice/migration.sql` to
temporary SQLite database files outside the repository. The tests then exercise
the adapter and harness through a SQLite-backed Prisma-like client.

Temporary databases are removed after tests. No `dev.db`, generated database
file or generated Prisma client is committed.

## Audit Scope

Phase 3C includes only minimal AuditRecord writes for:

- `REQUEST_CREATED`
- `ADMISSION_DECIDED`

These are deterministic persisted descriptors, not a broad audit service.
Phase 3C does not create an append-only event store, event emission,
hash-chain, signing, sealing or audit export.

Phase 3D extends this path by deciding pending approval requests and writing a
minimal `APPROVAL_DECIDED` audit record. That extension remains repository
bounded and still does not create approval UI, auth, event emission, audit
sealing or a broad audit service.

## Out Of Scope

Phase 3C does not add:

- full runtime product surface;
- API routes;
- UI;
- auth;
- Postgres support;
- multi-tenancy admin;
- billing;
- replay execution;
- external integrations;
- broad audit service;
- event emission;
- workflow execution;
- tool execution.

## Next Phase

Phase 3D Approval + Audit Runtime Slice now turns the pending approval path into
a narrow persisted approval decision and audit trail. The next recommended
phase should move toward a persisted investigation read model without broad UI,
API, billing, replay execution or external integration scope.
