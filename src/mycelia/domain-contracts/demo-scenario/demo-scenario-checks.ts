import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import { type CorrelationId } from "../../foundation/shared-kernel";
import {
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";

import {
  DemoScenarioSchema,
  type DemoScenario,
} from "./demo-scenario";
import {
  createDemoScenarioDenial,
  type DemoScenarioDenial,
} from "./demo-scenario-denial";
import {
  DemoScenarioKindSchema,
  type DemoScenarioKind,
} from "./demo-scenario-kind";
import {
  DemoScenarioLinkKindSchema,
  DemoScenarioLinkSchema,
  type DemoScenarioLink,
} from "./demo-scenario-link";
import {
  DemoScenarioReferenceSchema,
  DemoScenarioDescriptionSchema,
  DemoScenarioStepKindSchema,
  DemoScenarioStepSchema,
  DemoScenarioTitleSchema,
  type DemoScenarioStep,
} from "./demo-scenario-step";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

function hasValidStepTimestamp(input: Record<string, unknown>): boolean {
  const occurredAtValid =
    input.occurred_at === undefined ||
    (typeof input.occurred_at === "string" &&
      isAuditIsoDateTime(input.occurred_at));
  const plannedAtValid =
    input.planned_at === undefined ||
    (typeof input.planned_at === "string" &&
      isAuditIsoDateTime(input.planned_at));

  return (
    occurredAtValid &&
    plannedAtValid &&
    (input.occurred_at !== undefined || input.planned_at !== undefined)
  );
}

export function validateDemoScenarioKind(
  input: unknown,
): Result<DemoScenarioKind, DemoScenarioDenial> {
  const parsed = DemoScenarioKindSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_KIND_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateDemoScenarioStep(
  input: unknown,
): Result<DemoScenarioStep, DemoScenarioDenial> {
  if (!isRecord(input)) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_STEP_REQUIRED" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createDemoScenarioDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (
    !Number.isInteger(input.step_order) ||
    typeof input.step_order !== "number" ||
    input.step_order <= 0
  ) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_STEP_ORDER_INVALID" }),
    );
  }

  if (!DemoScenarioStepKindSchema.safeParse(input.step_kind).success) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_STEP_KIND_INVALID" }),
    );
  }

  if (
    !DemoScenarioTitleSchema.safeParse(input.title).success ||
    !DemoScenarioDescriptionSchema.safeParse(input.description).success
  ) {
    return err(
      createDemoScenarioDenial({ code: "UNSAFE_DEMO_SCENARIO_TEXT" }),
    );
  }

  if (
    input.descriptor_ref !== undefined &&
    !DemoScenarioReferenceSchema.safeParse(input.descriptor_ref).success
  ) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_STEP_REF_INVALID" }),
    );
  }

  if (!hasValidStepTimestamp(input)) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_STEP_TIMESTAMP_INVALID",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createDemoScenarioDenial({ code: "UNSAFE_DEMO_SCENARIO_METADATA" }),
    );
  }

  const parsed = DemoScenarioStepSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_STEP_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateDemoScenarioLink(
  input: unknown,
): Result<DemoScenarioLink, DemoScenarioDenial> {
  if (!isRecord(input)) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_LINK_REQUIRED" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createDemoScenarioDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (input.from_step_id === undefined || input.to_step_id === undefined) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_LINK_STEP_REFERENCE_INVALID",
      }),
    );
  }

  if (input.from_step_id === input.to_step_id) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_LINK_SELF_REFERENCE_INVALID",
      }),
    );
  }

  if (!DemoScenarioLinkKindSchema.safeParse(input.link_kind).success) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_LINK_INVALID" }),
    );
  }

  if (!AuditReasonCodeSchema.safeParse(input.reason_code).success) {
    return err(
      createDemoScenarioDenial({
        code: "UNSAFE_DEMO_SCENARIO_REASON_CODE",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createDemoScenarioDenial({ code: "UNSAFE_DEMO_SCENARIO_METADATA" }),
    );
  }

  const parsed = DemoScenarioLinkSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_LINK_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function isDemoScenarioOrdered(
  steps: readonly Pick<DemoScenarioStep, "step_order">[],
): boolean {
  for (let index = 1; index < steps.length; index += 1) {
    if (steps[index].step_order <= steps[index - 1].step_order) {
      return false;
    }
  }

  return true;
}

export function validateDemoScenario(
  input: unknown,
): Result<DemoScenario, DemoScenarioDenial> {
  if (!isRecord(input)) {
    return err(createDemoScenarioDenial({ code: "DEMO_SCENARIO_REQUIRED" }));
  }

  if (input.demo_scenario_id === undefined) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_ID_REQUIRED" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createDemoScenarioDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (input.project_id !== undefined && input.workspace_id === undefined) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_SCOPE_INVALID" }),
    );
  }

  if (!DemoScenarioKindSchema.safeParse(input.kind).success) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_KIND_INVALID" }),
    );
  }

  if (
    !DemoScenarioTitleSchema.safeParse(input.title).success ||
    !DemoScenarioDescriptionSchema.safeParse(input.description).success
  ) {
    return err(
      createDemoScenarioDenial({ code: "UNSAFE_DEMO_SCENARIO_TEXT" }),
    );
  }

  if (!Array.isArray(input.steps) || input.steps.length === 0) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_STEPS_REQUIRED" }),
    );
  }

  const parsedSteps: DemoScenarioStep[] = [];

  for (const step of input.steps) {
    const parsedStep = validateDemoScenarioStep(step);

    if (!parsedStep.ok) {
      return err(parsedStep.error);
    }

    parsedSteps.push(parsedStep.value);
  }

  if (!isDemoScenarioOrdered(parsedSteps)) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_STEP_ORDER_INVALID" }),
    );
  }

  if (parsedSteps.some((step) => step.tenant_id !== input.tenant_id)) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_STEP_TENANT_MISMATCH",
      }),
    );
  }

  if (!Array.isArray(input.links)) {
    return err(
      createDemoScenarioDenial({ code: "DEMO_SCENARIO_LINK_INVALID" }),
    );
  }

  const parsedLinks: DemoScenarioLink[] = [];

  for (const link of input.links) {
    const parsedLink = validateDemoScenarioLink(link);

    if (!parsedLink.ok) {
      return err(parsedLink.error);
    }

    parsedLinks.push(parsedLink.value);
  }

  if (parsedLinks.some((link) => link.tenant_id !== input.tenant_id)) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_LINK_TENANT_MISMATCH",
      }),
    );
  }

  const stepIds = new Set(
    parsedSteps.map((step) => step.demo_scenario_step_id),
  );
  const linksReferenceExistingSteps = parsedLinks.every(
    (link) => stepIds.has(link.from_step_id) && stepIds.has(link.to_step_id),
  );

  if (!linksReferenceExistingSteps) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_LINK_STEP_REFERENCE_INVALID",
      }),
    );
  }

  if (
    typeof input.created_at !== "string" ||
    !isAuditIsoDateTime(input.created_at)
  ) {
    return err(
      createDemoScenarioDenial({ code: "INVALID_DEMO_SCENARIO_TIMESTAMP" }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createDemoScenarioDenial({ code: "UNSAFE_DEMO_SCENARIO_METADATA" }),
    );
  }

  const parsed = DemoScenarioSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("steps")) {
      return err(
        createDemoScenarioDenial({
          code: "DEMO_SCENARIO_STEP_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("links")) {
      return err(
        createDemoScenarioDenial({
          code: "DEMO_SCENARIO_LINK_STEP_REFERENCE_INVALID",
        }),
      );
    }

    if (issuePath?.includes("project_id")) {
      return err(
        createDemoScenarioDenial({ code: "DEMO_SCENARIO_SCOPE_INVALID" }),
      );
    }

    return err(createDemoScenarioDenial({ code: "DEMO_SCENARIO_INVALID" }));
  }

  return ok(parsed.data);
}

export function ensureDemoScenarioStepsMatchTenant(
  scenario: DemoScenario,
): Result<true, DemoScenarioDenial> {
  const stepsMatchTenant = scenario.steps.every(
    (step) => step.tenant_id === scenario.tenant_id,
  );

  if (!stepsMatchTenant) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_STEP_TENANT_MISMATCH",
        correlation_id: scenario.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureDemoScenarioLinksMatchTenant(
  scenario: DemoScenario,
): Result<true, DemoScenarioDenial> {
  const linksMatchTenant = scenario.links.every(
    (link) => link.tenant_id === scenario.tenant_id,
  );

  if (!linksMatchTenant) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_LINK_TENANT_MISMATCH",
        correlation_id: scenario.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureDemoScenarioLinksReferenceExistingSteps(
  scenario: DemoScenario,
): Result<true, DemoScenarioDenial> {
  const stepIds = new Set(
    scenario.steps.map((step) => step.demo_scenario_step_id),
  );
  const linksReferenceExistingSteps = scenario.links.every(
    (link) => stepIds.has(link.from_step_id) && stepIds.has(link.to_step_id),
  );

  if (!linksReferenceExistingSteps) {
    return err(
      createDemoScenarioDenial({
        code: "DEMO_SCENARIO_LINK_STEP_REFERENCE_INVALID",
        correlation_id: scenario.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertDemoScenarioValid(
  input: unknown,
): Result<DemoScenario, DemoScenarioDenial> {
  return validateDemoScenario(input);
}

export function failClosedDemoScenario(
  correlation_id?: CorrelationId,
): DemoScenarioDenial {
  return createDemoScenarioDenial({
    code: "DEMO_SCENARIO_NOT_VALID",
    correlation_id,
  });
}
