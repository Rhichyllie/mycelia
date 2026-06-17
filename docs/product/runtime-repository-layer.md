# Runtime Repository Layer

Phase 3B defines the first minimal repository boundary for the governed
compliance/document review runtime slice.

This phase creates a pure TypeScript repository layer contract for the six
Phase 3A persistence records. It uses an injected structural client and safe
validation wrappers. It does not instantiate PrismaClient, connect to a
database, execute runtime, execute replay, call APIs, create auth, create UI,
emit events, write audit records, call tools, call external services, export
files, generate PDFs or create downloadable artifacts.

## Repository Boundary

The repository layer is a narrow application boundary over the Phase 3A schema
contract. It validates safe inputs, delegates reads and writes to an injected
client, validates returned descriptors and converts client failures into safe
denials.

The module does not create a global database client and does not connect at
import time. A future Phase 3C runtime flow can depend on this boundary without
owning database client construction.

## Record Kinds

The repository layer supports exactly these first-slice records:

- `GOVERNED_RUN`
- `RUNTIME_STATE_SNAPSHOT`
- `POLICY_DECISION_RECORD`
- `ADMISSION_DECISION_RECORD`
- `APPROVAL_REQUEST`
- `AUDIT_RECORD`

## Write Intents

The write intents are:

- `CREATE_GOVERNED_RUN`
- `CREATE_RUNTIME_STATE_SNAPSHOT`
- `CREATE_POLICY_DECISION_RECORD`
- `CREATE_ADMISSION_DECISION_RECORD`
- `CREATE_APPROVAL_REQUEST`
- `CREATE_AUDIT_RECORD`

Writes accept safe refs and summaries only. They do not accept raw document
content, raw file blobs, binary payloads, arbitrary JSON payloads, tool
execution payloads, full user profiles, raw audit logs or external service
responses.

## Read Intents

The read intents are:

- `FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION`
- `LIST_RUNTIME_STATE_SNAPSHOTS_BY_RUN`
- `LIST_POLICY_DECISION_RECORDS_BY_RUN`
- `LIST_ADMISSION_DECISION_RECORDS_BY_RUN`
- `LIST_APPROVAL_REQUESTS_BY_RUN`
- `LIST_AUDIT_RECORDS_BY_RUN`

Read operations require tenant scope. Run-linked reads require both `tenantId`
and `governedRunId`. Correlation reads require both `tenantId` and
`correlationId`.

## Tenant And Run Safety

The repository boundary fails closed when required tenant or run identifiers are
missing. It does not infer missing tenant or run existence, does not join
cross-tenant data and does not expose whether another tenant has matching data.

Every write input requires `tenantId`. Every run-linked write requires
`governedRunId`.

## Error And Denial Safety

Injected client errors are converted to safe denials. Denials do not include
SQL text, stack traces, raw database errors, sensitive input payloads or tenant
existence details.

Not-found reads return a safe non-enumerating result instead of leaking storage
details.

## Relationship To Phase 3A

Phase 3A activated the schema and migration contract in:

- `prisma/schema.prisma`
- `prisma/migrations/000001_minimal_runtime_slice/migration.sql`

Phase 3B does not change that schema or migration. It adds a repository
interface and validation boundary that can be implemented by a Prisma adapter in
a later phase without importing PrismaClient into this module.

## Still Not Active

Phase 3B does not add:

- runtime execution;
- replay execution;
- API routes;
- auth;
- UI;
- PrismaClient instantiation;
- database client bootstrapping;
- migrations or Prisma generate;
- event emission;
- audit writing;
- external integrations;
- tool execution.

## Next Phase

Phase 3C Governed Request Runtime Flow should use this repository boundary to
coordinate the first narrow runtime flow. Phase 3C should still keep Prisma
client ownership explicit, preserve tenant/run validation and avoid broad API,
auth, UI, replay execution or external integration scope.
