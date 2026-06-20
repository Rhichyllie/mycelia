import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import { type CorrelationId } from "../../foundation/shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";
import {
  DemoScenarioDescriptionSchema,
  DemoScenarioKindSchema,
  DemoScenarioReferenceSchema,
  DemoScenarioTitleSchema,
  validateDemoScenario,
} from "../../domain-contracts/demo-scenario";

import {
  DemoScenarioFixtureSchema,
  type DemoScenarioFixture,
} from "./demo-scenario-fixture";
import {
  createDemoScenarioFixtureDenial,
  type DemoScenarioFixtureDenial,
} from "./demo-scenario-fixture-denial";
import {
  DemoScenarioFixtureKindSchema,
  type DemoScenarioFixtureKind,
} from "./demo-scenario-fixture-kind";
import {
  DemoScenarioFixtureManifestSchema,
  type DemoScenarioFixtureManifest,
} from "./demo-scenario-fixture-manifest";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

export function validateDemoScenarioFixtureKind(
  input: unknown,
): Result<DemoScenarioFixtureKind, DemoScenarioFixtureDenial> {
  const parsed = DemoScenarioFixtureKindSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_KIND_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateDemoScenarioFixture(
  input: unknown,
): Result<DemoScenarioFixture, DemoScenarioFixtureDenial> {
  if (!isRecord(input)) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_REQUIRED",
      }),
    );
  }

  if (input.demo_scenario_fixture_id === undefined) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createDemoScenarioFixtureDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  if (input.project_id !== undefined && input.workspace_id === undefined) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_SCOPE_INVALID",
      }),
    );
  }

  if (!DemoScenarioFixtureKindSchema.safeParse(input.fixture_kind).success) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_KIND_INVALID",
      }),
    );
  }

  if (
    !DemoScenarioTitleSchema.safeParse(input.title).success ||
    !DemoScenarioDescriptionSchema.safeParse(input.description).success
  ) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "UNSAFE_DEMO_SCENARIO_FIXTURE_TEXT",
      }),
    );
  }

  if (input.scenario === undefined && input.scenario_ref === undefined) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_SCENARIO_REQUIRED",
      }),
    );
  }

  if (
    input.scenario_ref !== undefined &&
    !DemoScenarioReferenceSchema.safeParse(input.scenario_ref).success
  ) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_SCENARIO_REF_INVALID",
      }),
    );
  }

  if (
    !DemoScenarioKindSchema.safeParse(input.expected_scenario_kind).success
  ) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_EXPECTED_KIND_INVALID",
      }),
    );
  }

  if (input.scenario !== undefined) {
    const scenario = validateDemoScenario(input.scenario);

    if (!scenario.ok) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_SCENARIO_INVALID",
        }),
      );
    }

    if (scenario.value.tenant_id !== input.tenant_id) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_SCENARIO_TENANT_MISMATCH",
          correlation_id: scenario.value.correlation_id,
        }),
      );
    }

    if (scenario.value.kind !== input.expected_scenario_kind) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_SCENARIO_KIND_MISMATCH",
          correlation_id: scenario.value.correlation_id,
        }),
      );
    }
  }

  if (
    typeof input.created_at !== "string" ||
    !isAuditIsoDateTime(input.created_at)
  ) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "INVALID_DEMO_SCENARIO_FIXTURE_TIMESTAMP",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "UNSAFE_DEMO_SCENARIO_FIXTURE_METADATA",
      }),
    );
  }

  const parsed = DemoScenarioFixtureSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.includes("project_id")) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_SCOPE_INVALID",
        }),
      );
    }

    if (issuePath?.includes("scenario_ref")) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_SCENARIO_REF_INVALID",
        }),
      );
    }

    if (issuePath?.startsWith("scenario.tenant_id")) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_SCENARIO_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("scenario.kind")) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_SCENARIO_KIND_MISMATCH",
        }),
      );
    }

    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateDemoScenarioFixtureManifest(
  input: unknown,
): Result<DemoScenarioFixtureManifest, DemoScenarioFixtureDenial> {
  if (!isRecord(input)) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_MANIFEST_REQUIRED",
      }),
    );
  }

  if (input.demo_scenario_fixture_manifest_id === undefined) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_MANIFEST_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createDemoScenarioFixtureDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  if (!Array.isArray(input.fixtures) || input.fixtures.length === 0) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_MANIFEST_FIXTURES_REQUIRED",
      }),
    );
  }

  if (
    !Number.isInteger(input.manifest_version) ||
    typeof input.manifest_version !== "number" ||
    input.manifest_version <= 0
  ) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_MANIFEST_VERSION_INVALID",
      }),
    );
  }

  if (
    typeof input.created_at !== "string" ||
    !isAuditIsoDateTime(input.created_at)
  ) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "INVALID_DEMO_SCENARIO_FIXTURE_TIMESTAMP",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "UNSAFE_DEMO_SCENARIO_FIXTURE_METADATA",
      }),
    );
  }

  const fixtureIds = new Set<string>();

  for (const fixtureInput of input.fixtures) {
    const fixture = validateDemoScenarioFixture(fixtureInput);

    if (!fixture.ok) {
      return fixture;
    }

    if (fixture.value.tenant_id !== input.tenant_id) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_MANIFEST_TENANT_MISMATCH",
          correlation_id: fixture.value.correlation_id,
        }),
      );
    }

    if (fixtureIds.has(fixture.value.demo_scenario_fixture_id)) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_DUPLICATE_ID",
          correlation_id: fixture.value.correlation_id,
        }),
      );
    }

    fixtureIds.add(fixture.value.demo_scenario_fixture_id);
  }

  const parsed = DemoScenarioFixtureManifestSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("fixtures")) {
      return err(
        createDemoScenarioFixtureDenial({
          code: "DEMO_SCENARIO_FIXTURE_MANIFEST_TENANT_MISMATCH",
        }),
      );
    }

    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_MANIFEST_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function ensureDemoScenarioFixtureTenantMatchesScenario(
  fixture: DemoScenarioFixture,
): Result<true, DemoScenarioFixtureDenial> {
  if (
    fixture.scenario !== undefined &&
    fixture.scenario.tenant_id !== fixture.tenant_id
  ) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_SCENARIO_TENANT_MISMATCH",
        correlation_id: fixture.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureDemoScenarioFixtureKindMatchesScenario(
  fixture: DemoScenarioFixture,
): Result<true, DemoScenarioFixtureDenial> {
  if (
    fixture.scenario !== undefined &&
    fixture.scenario.kind !== fixture.expected_scenario_kind
  ) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_SCENARIO_KIND_MISMATCH",
        correlation_id: fixture.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureDemoScenarioFixtureManifestFixturesMatchTenant(
  manifest: DemoScenarioFixtureManifest,
): Result<true, DemoScenarioFixtureDenial> {
  const fixturesMatchTenant = manifest.fixtures.every(
    (fixture) => fixture.tenant_id === manifest.tenant_id,
  );

  if (!fixturesMatchTenant) {
    return err(
      createDemoScenarioFixtureDenial({
        code: "DEMO_SCENARIO_FIXTURE_MANIFEST_TENANT_MISMATCH",
      }),
    );
  }

  return ok(true);
}

export function assertDemoScenarioFixtureValid(
  input: unknown,
): Result<DemoScenarioFixture, DemoScenarioFixtureDenial> {
  return validateDemoScenarioFixture(input);
}

export function assertDemoScenarioFixtureManifestValid(
  input: unknown,
): Result<DemoScenarioFixtureManifest, DemoScenarioFixtureDenial> {
  return validateDemoScenarioFixtureManifest(input);
}

export function failClosedDemoScenarioFixture(
  correlation_id?: CorrelationId,
): DemoScenarioFixtureDenial {
  return createDemoScenarioFixtureDenial({
    code: "DEMO_SCENARIO_FIXTURE_NOT_VALID",
    correlation_id,
  });
}
