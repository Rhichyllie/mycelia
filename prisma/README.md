# Active Prisma Surface

Phase 3A introduces the first active Prisma schema and migration contract for
the minimal governed runtime slice.

The active files are:

- `schema.prisma`
- `migrations/000001_minimal_runtime_slice/migration.sql`

They define exactly six first-slice records:

- GovernedRun
- RuntimeStateSnapshot
- PolicyDecisionRecord
- AdmissionDecisionRecord
- ApprovalRequest
- AuditRecord

The datasource is SQLite and expects:

```text
DATABASE_URL="file:./dev.db"
```

Do not create `.env` secrets or commit generated database files.

Phase 3A is schema/migration contract activation only. It does not run
migrations, does not run Prisma generate, does not import PrismaClient in
application source, does not create repositories or services, does not execute
runtime, does not write audit records and does not store raw sensitive document
content.

Phase 3B should own any future runtime repository layer, PrismaClient usage and
controlled DB read/write activation.
