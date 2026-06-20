import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditMessageSchema,
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";
import { DemoScenarioReferenceSchema } from "../../domain-contracts/demo-scenario";

export const DemoReadinessFindingSeverities = [
  "INFO",
  "WARNING",
  "BLOCKER",
] as const;

export type DemoReadinessFindingSeverity =
  (typeof DemoReadinessFindingSeverities)[number];

export const DemoReadinessFindingSeveritySchema = z.enum(
  DemoReadinessFindingSeverities,
);

export const DemoReadinessFindingIdSchema = DemoScenarioReferenceSchema;
export const DemoReadinessDescriptorRefSchema =
  DemoScenarioReferenceSchema;

export const DemoReadinessFindingSchema = z
  .object({
    demo_readiness_finding_id: DemoReadinessFindingIdSchema,
    tenant_id: TenantIdSchema,
    severity: DemoReadinessFindingSeveritySchema,
    finding_code: AuditReasonCodeSchema,
    message: AuditMessageSchema,
    data_classification: DataClassificationSchema,
    observed_at: z.string().refine(
      isAuditIsoDateTime,
      "observed_at must be an ISO datetime string.",
    ),
    descriptor_ref: DemoReadinessDescriptorRefSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict();

export type DemoReadinessFinding = z.infer<
  typeof DemoReadinessFindingSchema
>;
export type DemoReadinessFindingInput = z.input<
  typeof DemoReadinessFindingSchema
>;
