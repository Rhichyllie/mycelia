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
import {
  DemoScenarioDescriptionSchema,
  DemoScenarioKindSchema,
  DemoScenarioReferenceSchema,
  DemoScenarioSchema,
  DemoScenarioTitleSchema,
} from "../../domain-contracts/demo-scenario";

import { DemoScenarioFixtureKindSchema } from "./demo-scenario-fixture-kind";

export const DemoScenarioFixtureIdSchema = DemoScenarioReferenceSchema;
export const DemoScenarioFixtureRefSchema = DemoScenarioReferenceSchema;

export const DemoScenarioFixtureSchema = z
  .object({
    demo_scenario_fixture_id: DemoScenarioFixtureIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    fixture_kind: DemoScenarioFixtureKindSchema,
    title: DemoScenarioTitleSchema,
    description: DemoScenarioDescriptionSchema,
    scenario: DemoScenarioSchema.optional(),
    scenario_ref: DemoScenarioFixtureRefSchema.optional(),
    expected_scenario_kind: DemoScenarioKindSchema,
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
  .superRefine((fixture, context) => {
    if (
      fixture.project_id !== undefined &&
      fixture.workspace_id === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "project_id requires workspace_id.",
        path: ["project_id"],
      });
    }

    if (fixture.scenario === undefined && fixture.scenario_ref === undefined) {
      context.addIssue({
        code: "custom",
        message: "scenario or scenario_ref is required.",
        path: ["scenario_ref"],
      });
    }

    if (
      fixture.scenario !== undefined &&
      fixture.scenario.tenant_id !== fixture.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "embedded scenario tenant_id must match fixture tenant_id.",
        path: ["scenario", "tenant_id"],
      });
    }

    if (
      fixture.scenario !== undefined &&
      fixture.scenario.kind !== fixture.expected_scenario_kind
    ) {
      context.addIssue({
        code: "custom",
        message:
          "embedded scenario kind must match expected_scenario_kind.",
        path: ["scenario", "kind"],
      });
    }
  });

export type DemoScenarioFixture = z.infer<
  typeof DemoScenarioFixtureSchema
>;
export type DemoScenarioFixtureInput = z.input<
  typeof DemoScenarioFixtureSchema
>;
