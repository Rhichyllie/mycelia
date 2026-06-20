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
import { validateInvestigationBundle } from "../../domain-contracts/investigation-bundle";

import {
  createReplayPlanDenial,
  type ReplayPlanDenial,
} from "./replay-plan-denial";
import {
  ReplayPlanSchema,
  type ReplayPlan,
} from "./replay-plan";
import {
  ReplayPlanScopeSchema,
  type ReplayPlanScope,
} from "./replay-plan-scope";
import {
  ReplayPlanReferenceSchema,
  ReplayPlanStepKindSchema,
  ReplayPlanStepSchema,
  type ReplayPlanStep,
} from "./replay-plan-step";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

export function validateReplayPlanScope(
  input: unknown,
): Result<ReplayPlanScope, ReplayPlanDenial> {
  if (!isRecord(input)) {
    return err(
      createReplayPlanDenial({ code: "REPLAY_PLAN_SCOPE_REQUIRED" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createReplayPlanDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  const parsed = ReplayPlanScopeSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createReplayPlanDenial({ code: "REPLAY_PLAN_SCOPE_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateReplayPlanStep(
  input: unknown,
): Result<ReplayPlanStep, ReplayPlanDenial> {
  if (!isRecord(input)) {
    return err(
      createReplayPlanDenial({ code: "REPLAY_PLAN_STEP_REQUIRED" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createReplayPlanDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (!ReplayPlanStepKindSchema.safeParse(input.step_kind).success) {
    return err(
      createReplayPlanDenial({ code: "REPLAY_PLAN_STEP_KIND_INVALID" }),
    );
  }

  if (!ReplayPlanReferenceSchema.safeParse(input.source_ref).success) {
    return err(
      createReplayPlanDenial({ code: "REPLAY_PLAN_STEP_REF_INVALID" }),
    );
  }

  if (
    !Number.isInteger(input.step_order) ||
    typeof input.step_order !== "number" ||
    input.step_order <= 0
  ) {
    return err(
      createReplayPlanDenial({ code: "REPLAY_PLAN_STEP_ORDER_INVALID" }),
    );
  }

  if (
    typeof input.planned_at !== "string" ||
    !isAuditIsoDateTime(input.planned_at)
  ) {
    return err(
      createReplayPlanDenial({
        code: "REPLAY_PLAN_STEP_TIMESTAMP_INVALID",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createReplayPlanDenial({ code: "UNSAFE_REPLAY_PLAN_METADATA" }),
    );
  }

  const parsed = ReplayPlanStepSchema.safeParse(input);

  if (!parsed.success) {
    return err(createReplayPlanDenial({ code: "REPLAY_PLAN_STEP_INVALID" }));
  }

  return ok(parsed.data);
}

export function isReplayPlanOrdered(
  steps: readonly Pick<ReplayPlanStep, "step_order">[],
): boolean {
  for (let index = 1; index < steps.length; index += 1) {
    if (steps[index].step_order <= steps[index - 1].step_order) {
      return false;
    }
  }

  return true;
}

export function validateReplayPlan(
  input: unknown,
): Result<ReplayPlan, ReplayPlanDenial> {
  if (!isRecord(input)) {
    return err(createReplayPlanDenial({ code: "REPLAY_PLAN_REQUIRED" }));
  }

  if (input.replay_plan_id === undefined) {
    return err(createReplayPlanDenial({ code: "REPLAY_PLAN_ID_REQUIRED" }));
  }

  if (input.tenant_id === undefined) {
    return err(createReplayPlanDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  const scope = validateReplayPlanScope(input.scope);

  if (!scope.ok) {
    return err(scope.error);
  }

  if (!Array.isArray(input.steps) || input.steps.length === 0) {
    return err(createReplayPlanDenial({ code: "REPLAY_PLAN_STEPS_REQUIRED" }));
  }

  const parsedSteps: ReplayPlanStep[] = [];

  for (const step of input.steps) {
    const parsedStep = validateReplayPlanStep(step);

    if (!parsedStep.ok) {
      return err(parsedStep.error);
    }

    parsedSteps.push(parsedStep.value);
  }

  if (!isReplayPlanOrdered(parsedSteps)) {
    return err(
      createReplayPlanDenial({ code: "REPLAY_PLAN_STEP_ORDER_INVALID" }),
    );
  }

  if (input.investigation_bundle !== undefined) {
    const bundle = validateInvestigationBundle(input.investigation_bundle);

    if (!bundle.ok) {
      return err(
        createReplayPlanDenial({ code: "REPLAY_PLAN_BUNDLE_INVALID" }),
      );
    }
  }

  if (
    input.investigation_bundle_ref !== undefined &&
    !ReplayPlanReferenceSchema.safeParse(input.investigation_bundle_ref)
      .success
  ) {
    return err(
      createReplayPlanDenial({ code: "REPLAY_PLAN_BUNDLE_REF_INVALID" }),
    );
  }

  if (
    typeof input.created_at !== "string" ||
    !isAuditIsoDateTime(input.created_at)
  ) {
    return err(
      createReplayPlanDenial({ code: "INVALID_REPLAY_PLAN_TIMESTAMP" }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createReplayPlanDenial({ code: "UNSAFE_REPLAY_PLAN_METADATA" }),
    );
  }

  const parsed = ReplayPlanSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("scope.tenant_id")) {
      return err(
        createReplayPlanDenial({
          code: "REPLAY_PLAN_SCOPE_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("steps")) {
      return err(
        createReplayPlanDenial({
          code: "REPLAY_PLAN_STEP_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("investigation_bundle")) {
      return err(
        createReplayPlanDenial({
          code: "REPLAY_PLAN_BUNDLE_TENANT_MISMATCH",
        }),
      );
    }

    return err(createReplayPlanDenial({ code: "REPLAY_PLAN_INVALID" }));
  }

  return ok(parsed.data);
}

export function ensureReplayPlanStepsMatchTenant(
  plan: ReplayPlan,
): Result<true, ReplayPlanDenial> {
  const stepsMatchTenant = plan.steps.every(
    (step) => step.tenant_id === plan.tenant_id,
  );

  if (!stepsMatchTenant) {
    return err(
      createReplayPlanDenial({
        code: "REPLAY_PLAN_STEP_TENANT_MISMATCH",
        correlation_id: plan.scope.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureReplayPlanBundleMatchesTenant(
  plan: ReplayPlan,
): Result<true, ReplayPlanDenial> {
  if (plan.investigation_bundle === undefined) {
    return ok(true);
  }

  if (plan.investigation_bundle.tenant_id !== plan.tenant_id) {
    return err(
      createReplayPlanDenial({
        code: "REPLAY_PLAN_BUNDLE_TENANT_MISMATCH",
        correlation_id: plan.scope.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertReplayPlanValid(
  input: unknown,
): Result<ReplayPlan, ReplayPlanDenial> {
  return validateReplayPlan(input);
}

export function failClosedReplayPlan(
  correlation_id?: CorrelationId,
): ReplayPlanDenial {
  return createReplayPlanDenial({
    code: "REPLAY_PLAN_NOT_VALID",
    correlation_id,
  });
}
