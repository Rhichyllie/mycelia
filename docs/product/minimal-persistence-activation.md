# Minimal Persistence Activation

Phase 3A activates the first database contract for the governed
compliance/document review runtime slice.

This phase creates the Prisma schema and one initial SQL migration for the six
planned first-slice records. It does not execute runtime, execute replay, query
or write databases from application code, call APIs, create auth, create UI,
emit events, write audit records, call tools, call external services, export
files, generate PDFs or create downloadable artifacts.

## Activated Records

The schema and migration define exactly these records:

- GovernedRun
- RuntimeStateSnapshot
- PolicyDecisionRecord
- AdmissionDecisionRecord
- ApprovalRequest
- AuditRecord

No users, tenants, documents, workflows, tool execution, events, replay
execution, investigation cases or billing tables are introduced.

## Schema And Migration

- Schema path: `prisma/schema.prisma`
- Migration path: `prisma/migrations/000001_minimal_runtime_slice/migration.sql`
- Datasource provider: `sqlite`
- Datasource URL convention: `DATABASE_URL`

For local development, the expected shape is:

```text
DATABASE_URL="file:./dev.db"
```

This document does not create an `.env` file and does not create `dev.db`.

## Raw Content Exclusion

The first persistence slice stores safe references, safe summaries and bounded
classification fields only. It does not store raw sensitive document content,
raw payloads, file blobs, binary content or arbitrary evidence blobs.

Evidence is represented by safe opaque references until a future approved
storage phase defines evidence handling.

## Relationships And Indexes

`GovernedRun` is the root record.

The other five records reference it through `governedRunId`:

- RuntimeStateSnapshot
- PolicyDecisionRecord
- AdmissionDecisionRecord
- ApprovalRequest
- AuditRecord

`ApprovalRequest` also references `AdmissionDecisionRecord` through
`admissionDecisionRecordId`.

Foreign keys use restrictive deletion to avoid accidental loss of approval,
state or audit-linked records. The migration adds tenant indexes and
governed-run indexes, plus a unique `tenantId + correlationId` constraint on
`GovernedRun`.

## Still Not Active

Phase 3A does not add:

- repository or service layer;
- PrismaClient imports or calls from application source;
- runtime execution;
- replay execution;
- DB reads or writes from application code;
- API routes;
- auth;
- UI;
- event emission;
- audit writing;
- external integrations;
- tool execution.

## Why 3B Owns Repository Work

Phase 3A creates the durable contract first so the schema, migration,
relationships and raw-content boundary can be reviewed independently.

Phase 3B Runtime Repository Layer should be responsible for any future
PrismaClient usage, repository APIs and controlled DB reads/writes.
