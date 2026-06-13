import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
} from "../shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../audit-record";
import { AuditTimelineSchema } from "../audit-timeline";

import {
  InvestigationBundleReferenceSchema,
  InvestigationBundleItemSchema,
} from "./investigation-bundle-item";
import { InvestigationBundleScopeSchema } from "./investigation-bundle-scope";
import { InvestigationBundleSummarySchema } from "./investigation-bundle-summary";

export const InvestigationBundleIdSchema =
  InvestigationBundleReferenceSchema;

export const InvestigationBundleSchema = z
  .object({
    investigation_bundle_id: InvestigationBundleIdSchema,
    tenant_id: TenantIdSchema,
    scope: InvestigationBundleScopeSchema,
    items: z
      .array(InvestigationBundleItemSchema)
      .min(1, "items must be non-empty."),
    audit_timeline: AuditTimelineSchema.optional(),
    audit_timeline_ref: InvestigationBundleReferenceSchema.optional(),
    summary: InvestigationBundleSummarySchema,
    created_at: z.string().refine(
      isAuditIsoDateTime,
      "created_at must be an ISO datetime string.",
    ),
    data_classification: DataClassificationSchema,
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((bundle, context) => {
    if (bundle.scope.tenant_id !== bundle.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "scope tenant_id must match bundle tenant_id.",
        path: ["scope", "tenant_id"],
      });
    }

    for (const [index, item] of bundle.items.entries()) {
      if (item.tenant_id !== bundle.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "item tenant_id must match bundle tenant_id.",
          path: ["items", index, "tenant_id"],
        });
      }
    }

    if (
      bundle.audit_timeline !== undefined &&
      bundle.audit_timeline.tenant_id !== bundle.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "audit_timeline tenant_id must match bundle tenant_id.",
        path: ["audit_timeline", "tenant_id"],
      });
    }

    if (bundle.summary.tenant_id !== bundle.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "summary tenant_id must match bundle tenant_id.",
        path: ["summary", "tenant_id"],
      });
    }

    if (bundle.summary.item_count !== bundle.items.length) {
      context.addIssue({
        code: "custom",
        message: "summary item_count must match bundle item count.",
        path: ["summary", "item_count"],
      });
    }

    const observedTimes = bundle.items.map((item) =>
      Date.parse(item.observed_at),
    );
    const earliestObserved = Math.min(...observedTimes);
    const latestObserved = Math.max(...observedTimes);

    if (Date.parse(bundle.summary.earliest_observed_at) > earliestObserved) {
      context.addIssue({
        code: "custom",
        message:
          "summary earliest_observed_at must cover bundle item observations.",
        path: ["summary", "earliest_observed_at"],
      });
    }

    if (Date.parse(bundle.summary.latest_observed_at) < latestObserved) {
      context.addIssue({
        code: "custom",
        message:
          "summary latest_observed_at must cover bundle item observations.",
        path: ["summary", "latest_observed_at"],
      });
    }
  });

export type InvestigationBundle = z.infer<typeof InvestigationBundleSchema>;
export type InvestigationBundleInput = z.input<
  typeof InvestigationBundleSchema
>;
