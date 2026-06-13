import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  ProjectIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../audit-record";
import { DemoScenarioReferenceSchema } from "../demo-scenario";
import {
  DemoScenarioFixtureManifestSchema,
  DemoScenarioFixtureSchema,
} from "../demo-scenario-fixture";

import {
  DemoReadinessFindingSchema,
} from "./demo-readiness-finding";
import {
  DemoReadinessReportStatusSchema,
} from "./demo-readiness-report-status";

export const DemoReadinessReportSubjectKinds = [
  "DEMO_SCENARIO_FIXTURE",
  "DEMO_SCENARIO_FIXTURE_MANIFEST",
] as const;

export type DemoReadinessReportSubjectKind =
  (typeof DemoReadinessReportSubjectKinds)[number];

export const DemoReadinessReportSubjectKindSchema = z.enum(
  DemoReadinessReportSubjectKinds,
);

export const DemoReadinessReportIdSchema = DemoScenarioReferenceSchema;
export const DemoReadinessSubjectRefSchema = DemoScenarioReferenceSchema;

export const DemoReadinessReportSchema = z
  .object({
    demo_readiness_report_id: DemoReadinessReportIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    status: DemoReadinessReportStatusSchema,
    subject_kind: DemoReadinessReportSubjectKindSchema,
    subject_ref: DemoReadinessSubjectRefSchema.optional(),
    fixture: DemoScenarioFixtureSchema.optional(),
    manifest: DemoScenarioFixtureManifestSchema.optional(),
    findings: z.array(DemoReadinessFindingSchema),
    data_classification: DataClassificationSchema,
    generated_at: z.string().refine(
      isAuditIsoDateTime,
      "generated_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((report, context) => {
    if (
      report.project_id !== undefined &&
      report.workspace_id === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "project_id requires workspace_id.",
        path: ["project_id"],
      });
    }

    if (
      report.subject_ref === undefined &&
      report.fixture === undefined &&
      report.manifest === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "subject_ref, fixture or manifest is required.",
        path: ["subject_ref"],
      });
    }

    if (
      report.fixture !== undefined &&
      report.fixture.tenant_id !== report.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "fixture tenant_id must match report tenant_id.",
        path: ["fixture", "tenant_id"],
      });
    }

    if (
      report.manifest !== undefined &&
      report.manifest.tenant_id !== report.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "manifest tenant_id must match report tenant_id.",
        path: ["manifest", "tenant_id"],
      });
    }

    for (const [index, finding] of report.findings.entries()) {
      if (finding.tenant_id !== report.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "finding tenant_id must match report tenant_id.",
          path: ["findings", index, "tenant_id"],
        });
      }
    }

    const hasBlocker = report.findings.some(
      (finding) => finding.severity === "BLOCKER",
    );

    if (report.status === "READY" && hasBlocker) {
      context.addIssue({
        code: "custom",
        message: "READY reports must not include BLOCKER findings.",
        path: ["status"],
      });
    }

    if (report.status === "NOT_READY" && !hasBlocker) {
      context.addIssue({
        code: "custom",
        message: "NOT_READY reports require a BLOCKER finding.",
        path: ["status"],
      });
    }
  });

export type DemoReadinessReport = z.infer<
  typeof DemoReadinessReportSchema
>;
export type DemoReadinessReportInput = z.input<
  typeof DemoReadinessReportSchema
>;
