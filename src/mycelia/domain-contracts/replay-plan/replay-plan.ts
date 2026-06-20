import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";
import { InvestigationBundleSchema } from "../../domain-contracts/investigation-bundle";

import {
  ReplayPlanReferenceSchema,
  ReplayPlanStepSchema,
} from "./replay-plan-step";
import { ReplayPlanScopeSchema } from "./replay-plan-scope";

export const ReplayPlanIdSchema = ReplayPlanReferenceSchema;

export const ReplayPlanSchema = z
  .object({
    replay_plan_id: ReplayPlanIdSchema,
    tenant_id: TenantIdSchema,
    scope: ReplayPlanScopeSchema,
    steps: z.array(ReplayPlanStepSchema).min(1, "steps must be non-empty."),
    investigation_bundle: InvestigationBundleSchema.optional(),
    investigation_bundle_ref: ReplayPlanReferenceSchema.optional(),
    data_classification: DataClassificationSchema,
    created_at: z.string().refine(
      isAuditIsoDateTime,
      "created_at must be an ISO datetime string.",
    ),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((plan, context) => {
    if (plan.scope.tenant_id !== plan.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "scope tenant_id must match replay plan tenant_id.",
        path: ["scope", "tenant_id"],
      });
    }

    for (const [index, step] of plan.steps.entries()) {
      if (step.tenant_id !== plan.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "step tenant_id must match replay plan tenant_id.",
          path: ["steps", index, "tenant_id"],
        });
      }
    }

    for (let index = 1; index < plan.steps.length; index += 1) {
      const previous = plan.steps[index - 1];
      const current = plan.steps[index];

      if (current.step_order <= previous.step_order) {
        context.addIssue({
          code: "custom",
          message: "steps must be strictly ordered by step_order.",
          path: ["steps", index, "step_order"],
        });
      }
    }

    if (
      plan.investigation_bundle !== undefined &&
      plan.investigation_bundle.tenant_id !== plan.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "investigation_bundle tenant_id must match replay plan tenant_id.",
        path: ["investigation_bundle", "tenant_id"],
      });
    }
  });

export type ReplayPlan = z.infer<typeof ReplayPlanSchema>;
export type ReplayPlanInput = z.input<typeof ReplayPlanSchema>;
