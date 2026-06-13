import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
} from "../shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../audit-record";
import { DemoScenarioReferenceSchema } from "../demo-scenario";

import {
  DemoScenarioFixtureSchema,
  type DemoScenarioFixture,
} from "./demo-scenario-fixture";

export const DemoScenarioFixtureManifestIdSchema =
  DemoScenarioReferenceSchema;

export const DemoScenarioFixtureManifestSchema = z
  .object({
    demo_scenario_fixture_manifest_id:
      DemoScenarioFixtureManifestIdSchema,
    tenant_id: TenantIdSchema,
    fixtures: z
      .array(DemoScenarioFixtureSchema)
      .min(1, "fixtures must be non-empty."),
    manifest_version: z
      .number()
      .int("manifest_version must be an integer.")
      .positive("manifest_version must be positive."),
    data_classification: DataClassificationSchema,
    created_at: z.string().refine(
      isAuditIsoDateTime,
      "created_at must be an ISO datetime string.",
    ),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((manifest, context) => {
    const fixtureIds = new Set<string>();

    for (const [index, fixture] of manifest.fixtures.entries()) {
      if (fixture.tenant_id !== manifest.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "fixture tenant_id must match manifest tenant_id.",
          path: ["fixtures", index, "tenant_id"],
        });
      }

      if (fixtureIds.has(fixture.demo_scenario_fixture_id)) {
        context.addIssue({
          code: "custom",
          message:
            "demo_scenario_fixture_id values must be unique in a manifest.",
          path: ["fixtures", index, "demo_scenario_fixture_id"],
        });
      }

      fixtureIds.add(fixture.demo_scenario_fixture_id);
    }
  });

export type DemoScenarioFixtureManifest = z.infer<
  typeof DemoScenarioFixtureManifestSchema
>;
export type DemoScenarioFixtureManifestInput = z.input<
  typeof DemoScenarioFixtureManifestSchema
>;

export type DemoScenarioFixtureManifestFixtures =
  readonly DemoScenarioFixture[];
