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

Phase 3D uses the existing `ApprovalRequest`, `RuntimeStateSnapshot` and
`AuditRecord` schema fields to decide pending approvals and record
`APPROVAL_DECIDED` audit entries through the injected repository boundary. It
does not modify the schema, run Prisma generate, run production migrations,
create `dev.db`, instantiate PrismaClient globally or create API/UI/auth
surfaces.

Phase 3E reads the same records through the repository boundary to reconstruct
persisted investigation descriptors. It does not modify the schema, run Prisma
generate, run production migrations, create `dev.db`, instantiate PrismaClient
globally or create API/UI/auth surfaces.

Phase 3F renders a static investigation UI fixture shaped like the Phase 3E
read model. It does not modify the schema, run Prisma generate, run production
migrations, create `dev.db`, instantiate PrismaClient globally or create live
database reads.

Phase 3G connects that UI to the Phase 3E read model through a controlled
read-only investigation selection boundary. It still does not modify the
schema, run Prisma generate, run production migrations, create `dev.db` or
instantiate PrismaClient globally.

Phase 3H adds a controlled governed request creation preview at
`/mycelia/request/new`. It is non-mutating UI only and does not modify the
schema, run Prisma generate, run production migrations, create `dev.db`,
instantiate PrismaClient globally or write request records.

Phase 3I adds a controlled approval decision preview at
`/mycelia/approval/decision`. It is non-mutating UI only and does not modify the
schema, run Prisma generate, run production migrations, create `dev.db`,
instantiate PrismaClient globally or write approval decision records.

Phase 3J adds deterministic demo scenario seeds that connect the controlled
surfaces. It does not modify the schema, run Prisma generate, run production
migrations, create `dev.db`, instantiate PrismaClient globally or write seed
records.

Phase 3K renders those seeds as a controlled walkthrough at `/mycelia/demo`.
It does not modify the schema, run Prisma generate, run production migrations,
create `dev.db`, instantiate PrismaClient globally or write demo records.
