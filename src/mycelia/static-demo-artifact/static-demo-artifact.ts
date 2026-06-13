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
import {
  DemoScenarioDescriptionSchema,
  DemoScenarioReferenceSchema,
  DemoScenarioTitleSchema,
} from "../demo-scenario";
import { DemoReadinessReportSchema } from "../demo-readiness-report";
import { DemoScenarioFixtureManifestSchema } from "../demo-scenario-fixture";

import {
  StaticDemoArtifactExposureSchema,
  isStaticDemoArtifactExposureCompatible,
} from "./static-demo-artifact-exposure";
import { StaticDemoArtifactKindSchema } from "./static-demo-artifact-kind";
import { StaticDemoArtifactSectionSchema } from "./static-demo-artifact-section";

export const StaticDemoArtifactIdSchema = DemoScenarioReferenceSchema;
export const StaticDemoArtifactRefSchema = DemoScenarioReferenceSchema;

export const StaticDemoArtifactSchema = z
  .object({
    static_demo_artifact_id: StaticDemoArtifactIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    artifact_kind: StaticDemoArtifactKindSchema,
    exposure: StaticDemoArtifactExposureSchema,
    title: DemoScenarioTitleSchema,
    summary: DemoScenarioDescriptionSchema,
    fixture_manifest_ref: StaticDemoArtifactRefSchema.optional(),
    readiness_report_ref: StaticDemoArtifactRefSchema.optional(),
    fixture_manifest: DemoScenarioFixtureManifestSchema.optional(),
    readiness_report: DemoReadinessReportSchema.optional(),
    sections: z
      .array(StaticDemoArtifactSectionSchema)
      .min(1, "sections must be non-empty."),
    data_classification: DataClassificationSchema,
    created_at: z.string().refine(
      isAuditIsoDateTime,
      "created_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((artifact, context) => {
    if (
      artifact.project_id !== undefined &&
      artifact.workspace_id === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "project_id requires workspace_id.",
        path: ["project_id"],
      });
    }

    if (
      artifact.fixture_manifest_ref === undefined &&
      artifact.readiness_report_ref === undefined &&
      artifact.fixture_manifest === undefined &&
      artifact.readiness_report === undefined
    ) {
      context.addIssue({
        code: "custom",
        message:
          "fixture or readiness report reference or descriptor is required.",
        path: ["fixture_manifest_ref"],
      });
    }

    if (
      artifact.fixture_manifest !== undefined &&
      artifact.fixture_manifest.tenant_id !== artifact.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "fixture_manifest tenant_id must match artifact tenant_id.",
        path: ["fixture_manifest", "tenant_id"],
      });
    }

    if (
      artifact.readiness_report !== undefined &&
      artifact.readiness_report.tenant_id !== artifact.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "readiness_report tenant_id must match artifact tenant_id.",
        path: ["readiness_report", "tenant_id"],
      });
    }

    for (const [index, section] of artifact.sections.entries()) {
      if (section.tenant_id !== artifact.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "section tenant_id must match artifact tenant_id.",
          path: ["sections", index, "tenant_id"],
        });
      }
    }

    for (let index = 1; index < artifact.sections.length; index += 1) {
      const previous = artifact.sections[index - 1];
      const current = artifact.sections[index];

      if (current.section_order <= previous.section_order) {
        context.addIssue({
          code: "custom",
          message: "sections must be strictly ordered by section_order.",
          path: ["sections", index, "section_order"],
        });
      }
    }

    const sectionClassifications = artifact.sections.map(
      (section) => section.data_classification,
    );

    if (
      !isStaticDemoArtifactExposureCompatible(artifact.exposure, [
        artifact.data_classification,
        ...sectionClassifications,
      ])
    ) {
      context.addIssue({
        code: "custom",
        message: "exposure is incompatible with data classification.",
        path: ["exposure"],
      });
    }
  });

export type StaticDemoArtifact = z.infer<typeof StaticDemoArtifactSchema>;
export type StaticDemoArtifactInput = z.input<
  typeof StaticDemoArtifactSchema
>;
