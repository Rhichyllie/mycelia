import { z } from "zod";

export const MINIMAL_PERSISTENCE_ACTIVATION_PHASE = "3A";

export const MINIMAL_PERSISTENCE_ACTIVATION_NAME =
  "Minimal Persistence Activation";

export const MINIMAL_PERSISTENCE_ACTIVATION_STATUS =
  "schema and migration contract active only";

export const MinimalPersistenceActivationVerdicts = [
  "ACTIVE_SCHEMA_CONTRACT",
  "BLOCKED",
  "NOT_ACTIVE",
] as const;

export type MinimalPersistenceActivationVerdict =
  (typeof MinimalPersistenceActivationVerdicts)[number];

export const MinimalPersistenceRecordNames = [
  "GovernedRun",
  "RuntimeStateSnapshot",
  "PolicyDecisionRecord",
  "AdmissionDecisionRecord",
  "ApprovalRequest",
  "AuditRecord",
] as const;

export type MinimalPersistenceRecordName =
  (typeof MinimalPersistenceRecordNames)[number];

export const MinimalPersistenceActivationVerdictSchema = z.enum(
  MinimalPersistenceActivationVerdicts,
);

export const MinimalPersistenceRecordNameSchema = z.enum(
  MinimalPersistenceRecordNames,
);

export const MinimalPersistenceRecordSchema = z
  .object({
    name: MinimalPersistenceRecordNameSchema,
    table: MinimalPersistenceRecordNameSchema,
    tenant_scoped: z.literal(true),
    run_linked: z.boolean(),
    required_fields: z.array(z.string().min(1).max(120)).min(1),
    relationships: z.array(z.string().min(1).max(240)).min(1),
    indexes: z.array(z.string().min(1).max(180)).min(1),
    raw_content_policy: z.literal("safe refs and summaries only"),
  })
  .strict();

export type MinimalPersistenceRecord = z.infer<
  typeof MinimalPersistenceRecordSchema
>;

export const MinimalPersistenceActivationSchema = z
  .object({
    phase: z.literal(MINIMAL_PERSISTENCE_ACTIVATION_PHASE),
    name: z.literal(MINIMAL_PERSISTENCE_ACTIVATION_NAME),
    status: z.literal(MINIMAL_PERSISTENCE_ACTIVATION_STATUS),
    verdict: MinimalPersistenceActivationVerdictSchema,
    datasource_provider: z.literal("postgresql"),
    datasource_url_env: z.literal("DATABASE_URL"),
    schema_path: z.literal("prisma/schema.prisma"),
    migration_path: z.literal(
      "prisma/migrations/000001_postgres_baseline/migration.sql",
    ),
    activated_records: z.array(MinimalPersistenceRecordSchema).length(6),
    intentionally_excluded_records: z.array(z.string().min(1).max(120)).min(1),
    raw_content_exclusion_policy: z.array(z.string().min(1).max(220)).min(1),
    relationship_policy: z.array(z.string().min(1).max(260)).min(1),
    source_boundary: z.array(z.string().min(1).max(220)).min(1),
    next_phase_boundary: z.literal("3B Runtime Repository Layer"),
    safe_summary: z.string().min(1).max(420),
  })
  .strict();

export type MinimalPersistenceActivation = z.infer<
  typeof MinimalPersistenceActivationSchema
>;

const ACTIVATED_RECORDS = [
  {
    name: "GovernedRun",
    table: "GovernedRun",
    tenant_scoped: true,
    run_linked: false,
    required_fields: [
      "id",
      "tenantId",
      "correlationId",
      "currentState",
      "status",
      "resourceRef",
      "requesterRef",
      "purpose",
      "createdAt",
      "updatedAt",
    ],
    relationships: [
      "root record for state snapshots, policy decisions, admission decisions, approval requests and audit records",
    ],
    indexes: ["tenantId", "unique tenantId + correlationId"],
    raw_content_policy: "safe refs and summaries only",
  },
  {
    name: "RuntimeStateSnapshot",
    table: "RuntimeStateSnapshot",
    tenant_scoped: true,
    run_linked: true,
    required_fields: [
      "id",
      "tenantId",
      "governedRunId",
      "state",
      "sequence",
      "reasonCode",
      "safeSummary",
      "createdAt",
    ],
    relationships: ["belongs to GovernedRun by governedRunId"],
    indexes: ["tenantId", "governedRunId"],
    raw_content_policy: "safe refs and summaries only",
  },
  {
    name: "PolicyDecisionRecord",
    table: "PolicyDecisionRecord",
    tenant_scoped: true,
    run_linked: true,
    required_fields: [
      "id",
      "tenantId",
      "governedRunId",
      "riskLevel",
      "outcome",
      "reasonCode",
      "safeSummary",
      "policyRef",
      "createdAt",
    ],
    relationships: ["belongs to GovernedRun by governedRunId"],
    indexes: ["tenantId", "governedRunId"],
    raw_content_policy: "safe refs and summaries only",
  },
  {
    name: "AdmissionDecisionRecord",
    table: "AdmissionDecisionRecord",
    tenant_scoped: true,
    run_linked: true,
    required_fields: [
      "id",
      "tenantId",
      "governedRunId",
      "outcome",
      "reasonCode",
      "safeSummary",
      "lifecycleIntentHint",
      "createdAt",
    ],
    relationships: [
      "belongs to GovernedRun by governedRunId",
      "may be referenced by ApprovalRequest through admissionDecisionRecordId",
    ],
    indexes: ["tenantId", "governedRunId"],
    raw_content_policy: "safe refs and summaries only",
  },
  {
    name: "ApprovalRequest",
    table: "ApprovalRequest",
    tenant_scoped: true,
    run_linked: true,
    required_fields: [
      "id",
      "tenantId",
      "governedRunId",
      "admissionDecisionRecordId",
      "status",
      "requestedRole",
      "requesterRef",
      "createdAt",
    ],
    relationships: [
      "belongs to GovernedRun by governedRunId",
      "references AdmissionDecisionRecord by admissionDecisionRecordId",
    ],
    indexes: ["tenantId", "governedRunId", "admissionDecisionRecordId"],
    raw_content_policy: "safe refs and summaries only",
  },
  {
    name: "AuditRecord",
    table: "AuditRecord",
    tenant_scoped: true,
    run_linked: true,
    required_fields: [
      "id",
      "tenantId",
      "governedRunId",
      "moment",
      "requirement",
      "recordKindHint",
      "reasonCode",
      "safeSummary",
      "subjectRef",
      "createdAt",
    ],
    relationships: ["belongs to GovernedRun by governedRunId"],
    indexes: ["tenantId", "governedRunId"],
    raw_content_policy: "safe refs and summaries only",
  },
] as const satisfies readonly MinimalPersistenceRecord[];

export const MINIMAL_PERSISTENCE_ACTIVATION = {
  phase: MINIMAL_PERSISTENCE_ACTIVATION_PHASE,
  name: MINIMAL_PERSISTENCE_ACTIVATION_NAME,
  status: MINIMAL_PERSISTENCE_ACTIVATION_STATUS,
  verdict: "ACTIVE_SCHEMA_CONTRACT",
  datasource_provider: "postgresql",
  datasource_url_env: "DATABASE_URL",
  schema_path: "prisma/schema.prisma",
  migration_path:
    "prisma/migrations/000001_postgres_baseline/migration.sql",
  activated_records: ACTIVATED_RECORDS,
  intentionally_excluded_records: [
    "User",
    "Tenant",
    "Document",
    "Workflow",
    "ToolExecution",
    "Event",
    "ReplayExecution",
    "InvestigationCase",
    "Billing",
    "ReplayDryRunPlan",
    "InvestigationBundleView",
  ],
  raw_content_exclusion_policy: [
    "raw sensitive document content is not stored",
    "records use safe refs and summaries instead of raw payloads",
    "evidence remains an opaque reference until future approved storage work",
  ],
  relationship_policy: [
    "GovernedRun is the root first-slice record",
    "run-linked records reference GovernedRun through governedRunId",
    "ApprovalRequest may reference AdmissionDecisionRecord for approval basis",
    "foreign keys use restrictive deletion to avoid accidental audit or approval loss",
  ],
  source_boundary: [
    "no PrismaClient import",
    "no database read activation",
    "no database write activation",
    "no repository or service layer",
    "no runtime execution",
    "no replay execution",
    "no API route activation",
    "no audit writing from application code",
  ],
  next_phase_boundary: "3B Runtime Repository Layer",
  safe_summary:
    "The original minimal governed runtime records are now part of the PostgreSQL baseline, with tenant-scoped persistence active through the live repository layer.",
} as const;

export function getMinimalPersistenceActivation():
  MinimalPersistenceActivation {
  return MinimalPersistenceActivationSchema.parse(
    MINIMAL_PERSISTENCE_ACTIVATION,
  );
}
