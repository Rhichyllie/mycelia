import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  ProjectIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../../foundation/shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";

import { DemoScenarioKindSchema } from "./demo-scenario-kind";
import { DemoScenarioLinkSchema } from "./demo-scenario-link";
import {
  DemoScenarioDescriptionSchema,
  DemoScenarioReferenceSchema,
  DemoScenarioStepSchema,
  DemoScenarioTitleSchema,
} from "./demo-scenario-step";

export const DemoScenarioIdSchema = DemoScenarioReferenceSchema;

export const DemoScenarioSchema = z
  .object({
    demo_scenario_id: DemoScenarioIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    kind: DemoScenarioKindSchema,
    title: DemoScenarioTitleSchema,
    description: DemoScenarioDescriptionSchema,
    steps: z
      .array(DemoScenarioStepSchema)
      .min(1, "steps must be non-empty."),
    links: z.array(DemoScenarioLinkSchema),
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
  .superRefine((scenario, context) => {
    if (
      scenario.project_id !== undefined &&
      scenario.workspace_id === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "project_id requires workspace_id.",
        path: ["project_id"],
      });
    }

    for (const [index, step] of scenario.steps.entries()) {
      if (step.tenant_id !== scenario.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "step tenant_id must match demo scenario tenant_id.",
          path: ["steps", index, "tenant_id"],
        });
      }
    }

    for (let index = 1; index < scenario.steps.length; index += 1) {
      const previous = scenario.steps[index - 1];
      const current = scenario.steps[index];

      if (current.step_order <= previous.step_order) {
        context.addIssue({
          code: "custom",
          message: "steps must be strictly ordered by step_order.",
          path: ["steps", index, "step_order"],
        });
      }
    }

    const stepIds = new Set(
      scenario.steps.map((step) => step.demo_scenario_step_id),
    );

    for (const [index, link] of scenario.links.entries()) {
      if (link.tenant_id !== scenario.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "link tenant_id must match demo scenario tenant_id.",
          path: ["links", index, "tenant_id"],
        });
      }

      if (
        !stepIds.has(link.from_step_id) ||
        !stepIds.has(link.to_step_id)
      ) {
        context.addIssue({
          code: "custom",
          message: "links must reference existing demo scenario steps.",
          path: ["links", index],
        });
      }
    }
  });

export type DemoScenario = z.infer<typeof DemoScenarioSchema>;
export type DemoScenarioInput = z.input<typeof DemoScenarioSchema>;
