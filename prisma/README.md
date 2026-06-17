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

Phase 3B adds an injected-client runtime repository layer for the six records.
That repository boundary does not instantiate PrismaClient, create a global
database client, run migrations, run Prisma generate, execute runtime or write
audit records.

Future PrismaClient ownership and controlled runtime DB read/write activation
must remain explicit in later phases.

Phase 3C applies this migration SQL to disposable SQLite test databases through
the persisted governed flow harness. Those tests remove temporary database
files and do not create or commit `dev.db`.
