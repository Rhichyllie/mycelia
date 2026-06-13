import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
} from "../shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../audit-record";

import { InvestigationBundleReferenceSchema } from "./investigation-bundle-item";

export const InvestigationBundleSummaryIdSchema =
  InvestigationBundleReferenceSchema;

export const InvestigationBundleSummarySchema = z
  .object({
    summary_id: InvestigationBundleSummaryIdSchema,
    tenant_id: TenantIdSchema,
    item_count: z
      .number()
      .int("item_count must be an integer.")
      .nonnegative("item_count must be non-negative."),
    earliest_observed_at: z.string().refine(
      isAuditIsoDateTime,
      "earliest_observed_at must be an ISO datetime string.",
    ),
    latest_observed_at: z.string().refine(
      isAuditIsoDateTime,
      "latest_observed_at must be an ISO datetime string.",
    ),
    data_classification: DataClassificationSchema,
    generated_at: z.string().refine(
      isAuditIsoDateTime,
      "generated_at must be an ISO datetime string.",
    ),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .refine(
    (summary) =>
      Date.parse(summary.latest_observed_at) >=
      Date.parse(summary.earliest_observed_at),
    "latest_observed_at must not be before earliest_observed_at.",
  );

export type InvestigationBundleSummary = z.infer<
  typeof InvestigationBundleSummarySchema
>;
export type InvestigationBundleSummaryInput = z.input<
  typeof InvestigationBundleSummarySchema
>;
