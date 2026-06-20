import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
} from "../../domain-contracts/audit-record";

import {
  DemoScenarioReferenceSchema,
  DemoScenarioStepIdSchema,
} from "./demo-scenario-step";

export const DemoScenarioLinkKinds = [
  "CAUSES",
  "REFERENCES",
  "VALIDATES",
  "PRODUCES_DESCRIPTOR",
  "EXPLAINS",
  "PREPARES_NEXT",
] as const;

export type DemoScenarioLinkKind = (typeof DemoScenarioLinkKinds)[number];

export const DemoScenarioLinkKindSchema = z.enum(DemoScenarioLinkKinds);

export const DemoScenarioLinkIdSchema = DemoScenarioReferenceSchema;

export const DemoScenarioLinkSchema = z
  .object({
    demo_scenario_link_id: DemoScenarioLinkIdSchema,
    tenant_id: TenantIdSchema,
    from_step_id: DemoScenarioStepIdSchema,
    to_step_id: DemoScenarioStepIdSchema,
    link_kind: DemoScenarioLinkKindSchema,
    reason_code: AuditReasonCodeSchema,
    data_classification: DataClassificationSchema,
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .refine(
    (link) => link.from_step_id !== link.to_step_id,
    "from_step_id and to_step_id must be different.",
  );

export type DemoScenarioLink = z.infer<typeof DemoScenarioLinkSchema>;
export type DemoScenarioLinkInput = z.input<typeof DemoScenarioLinkSchema>;
