import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
} from "../shared-kernel";
import { SafeAuditMetadataSchema } from "../audit-record";
import {
  DemoScenarioDescriptionSchema,
  DemoScenarioReferenceSchema,
  DemoScenarioTitleSchema,
} from "../demo-scenario";

export const StaticDemoArtifactSectionKinds = [
  "SCENARIO_OVERVIEW",
  "FIXTURE_SUMMARY",
  "READINESS_SUMMARY",
  "GOVERNANCE_TRACE",
  "AUDIT_TRACE",
  "REPLAY_PLAN_SUMMARY",
  "LIMITATIONS_AND_NON_GOALS",
] as const;

export type StaticDemoArtifactSectionKind =
  (typeof StaticDemoArtifactSectionKinds)[number];

export const StaticDemoArtifactSectionKindSchema = z.enum(
  StaticDemoArtifactSectionKinds,
);

export const StaticDemoArtifactSectionIdSchema =
  DemoScenarioReferenceSchema;
export const StaticDemoArtifactDescriptorRefSchema =
  DemoScenarioReferenceSchema;

export const StaticDemoArtifactSectionSchema = z
  .object({
    static_demo_artifact_section_id:
      StaticDemoArtifactSectionIdSchema,
    tenant_id: TenantIdSchema,
    section_order: z
      .number()
      .int("section_order must be an integer.")
      .positive("section_order must be positive."),
    section_kind: StaticDemoArtifactSectionKindSchema,
    title: DemoScenarioTitleSchema,
    summary: DemoScenarioDescriptionSchema,
    descriptor_ref: StaticDemoArtifactDescriptorRefSchema.optional(),
    data_classification: DataClassificationSchema,
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict();

export type StaticDemoArtifactSection = z.infer<
  typeof StaticDemoArtifactSectionSchema
>;
export type StaticDemoArtifactSectionInput = z.input<
  typeof StaticDemoArtifactSectionSchema
>;
