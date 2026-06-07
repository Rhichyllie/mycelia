import {
  err,
  ok,
  type Result,
} from "../shared-kernel";
import { validateRuntimeAdmissionDecision } from "../runtime-admission-gateway";
import { validateRuntimeEnvelope } from "../runtime-envelope";

import {
  GovernedRunSchema,
  SafeGovernedRunMetadataSchema,
  isGovernedRunIsoDateTime,
  type GovernedRun,
} from "./governed-run";
import {
  createGovernedRunDenial,
  type GovernedRunDenial,
} from "./governed-run-denial";
import {
  GovernedRunStatusSchema,
  type GovernedRunStatus,
  isAdmittedGovernedRunStatus,
  isCancelledGovernedRunStatus,
  isCreatedGovernedRunStatus,
  isRejectedGovernedRunStatus,
} from "./governed-run-status";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasInvalidTimestamp(input: Record<string, unknown>): boolean {
  if (
    typeof input.created_at !== "string" ||
    !isGovernedRunIsoDateTime(input.created_at)
  ) {
    return true;
  }

  return (
    (input.admitted_at !== undefined &&
      (typeof input.admitted_at !== "string" ||
        !isGovernedRunIsoDateTime(input.admitted_at))) ||
    (input.rejected_at !== undefined &&
      (typeof input.rejected_at !== "string" ||
        !isGovernedRunIsoDateTime(input.rejected_at))) ||
    (input.cancelled_at !== undefined &&
      (typeof input.cancelled_at !== "string" ||
        !isGovernedRunIsoDateTime(input.cancelled_at)))
  );
}

export function validateGovernedRunStatus(
  input: unknown,
): Result<GovernedRunStatus, GovernedRunDenial> {
  const parsed = GovernedRunStatusSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createGovernedRunDenial({ code: "GOVERNED_RUN_STATUS_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateGovernedRun(
  input: unknown,
): Result<GovernedRun, GovernedRunDenial> {
  if (!isRecord(input)) {
    return err(createGovernedRunDenial({ code: "GOVERNED_RUN_REQUIRED" }));
  }

  if (input.run_id === undefined) {
    return err(createGovernedRunDenial({ code: "RUN_ID_REQUIRED" }));
  }

  if (input.tenant_id === undefined) {
    return err(createGovernedRunDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (
    input.project_id !== undefined &&
    input.workspace_id === undefined
  ) {
    return err(
      createGovernedRunDenial({ code: "GOVERNED_RUN_SCOPE_INVALID" }),
    );
  }

  if (
    input.runtime_envelope_id === undefined &&
    input.runtime_envelope === undefined
  ) {
    return err(
      createGovernedRunDenial({ code: "RUNTIME_ENVELOPE_REQUIRED" }),
    );
  }

  if (input.runtime_envelope !== undefined) {
    const envelope = validateRuntimeEnvelope(input.runtime_envelope);

    if (!envelope.ok) {
      return err(
        createGovernedRunDenial({
          code: "RUNTIME_ENVELOPE_INVALID",
          correlation_id: envelope.error.correlation_id,
        }),
      );
    }
  }

  if (
    input.admission_decision_id === undefined &&
    input.admission_decision === undefined
  ) {
    return err(
      createGovernedRunDenial({ code: "ADMISSION_DECISION_REQUIRED" }),
    );
  }

  if (input.admission_decision !== undefined) {
    const admission = validateRuntimeAdmissionDecision(
      input.admission_decision,
    );

    if (!admission.ok) {
      return err(
        createGovernedRunDenial({
          code: "ADMISSION_DECISION_INVALID",
          correlation_id:
            isRecord(input) && typeof input.correlation_id === "string"
              ? undefined
              : undefined,
        }),
      );
    }
  }

  if (hasInvalidTimestamp(input)) {
    return err(
      createGovernedRunDenial({ code: "INVALID_GOVERNED_RUN_TIMESTAMP" }),
    );
  }

  if (
    input.metadata !== undefined &&
    !SafeGovernedRunMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(
      createGovernedRunDenial({ code: "UNSAFE_GOVERNED_RUN_METADATA" }),
    );
  }

  const parsed = GovernedRunSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const issuePath = firstIssue?.path.join(".");
    const issueMessage = firstIssue?.message ?? "";

    if (issuePath?.includes("runtime_envelope")) {
      return err(
        createGovernedRunDenial({
          code: issuePath.includes("tenant_id")
            ? "GOVERNED_RUN_TENANT_MISMATCH"
            : "RUNTIME_ENVELOPE_INVALID",
        }),
      );
    }

    if (issuePath?.includes("admission_decision")) {
      if (issuePath.includes("tenant_id")) {
        return err(
          createGovernedRunDenial({
            code: "ADMISSION_DECISION_TENANT_MISMATCH",
          }),
        );
      }

      if (issueMessage.includes("ADMITTED")) {
        return err(
          createGovernedRunDenial({ code: "ADMITTED_DECISION_REQUIRED" }),
        );
      }

      if (issueMessage.includes("REJECTED")) {
        return err(
          createGovernedRunDenial({ code: "REJECTED_DECISION_REQUIRED" }),
        );
      }

      return err(
        createGovernedRunDenial({ code: "ADMISSION_DECISION_INVALID" }),
      );
    }

    if (
      issuePath?.includes("_at") ||
      issueMessage.toLowerCase().includes("created_at")
    ) {
      return err(
        createGovernedRunDenial({ code: "INVALID_GOVERNED_RUN_TIMESTAMP" }),
      );
    }

    if (issuePath === "project_id") {
      return err(
        createGovernedRunDenial({ code: "GOVERNED_RUN_SCOPE_INVALID" }),
      );
    }

    return err(createGovernedRunDenial({ code: "GOVERNED_RUN_INVALID" }));
  }

  return ok(parsed.data);
}

export function isGovernedRunCreated(input: unknown): boolean {
  const run = validateGovernedRun(input);

  return run.ok && isCreatedGovernedRunStatus(run.value.status);
}

export function isGovernedRunAdmitted(input: unknown): boolean {
  const run = validateGovernedRun(input);

  return run.ok && isAdmittedGovernedRunStatus(run.value.status);
}

export function isGovernedRunRejected(input: unknown): boolean {
  const run = validateGovernedRun(input);

  return run.ok && isRejectedGovernedRunStatus(run.value.status);
}

export function isGovernedRunCancelled(input: unknown): boolean {
  const run = validateGovernedRun(input);

  return run.ok && isCancelledGovernedRunStatus(run.value.status);
}

export function ensureGovernedRunTenantMatchesEnvelope(
  run: GovernedRun,
): Result<true, GovernedRunDenial> {
  if (
    run.runtime_envelope !== undefined &&
    run.runtime_envelope.tenant_id !== run.tenant_id
  ) {
    return err(
      createGovernedRunDenial({
        code: "GOVERNED_RUN_TENANT_MISMATCH",
        correlation_id: run.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureGovernedRunTenantMatchesAdmission(
  run: GovernedRun,
): Result<true, GovernedRunDenial> {
  if (
    run.admission_decision !== undefined &&
    run.admission_decision.tenant_id !== run.tenant_id
  ) {
    return err(
      createGovernedRunDenial({
        code: "ADMISSION_DECISION_TENANT_MISMATCH",
        correlation_id: run.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertGovernedRunAdmitted(
  input: unknown,
): Result<GovernedRun, GovernedRunDenial> {
  const run = validateGovernedRun(input);

  if (!run.ok) {
    return run;
  }

  if (!isAdmittedGovernedRunStatus(run.value.status)) {
    return err(
      createGovernedRunDenial({
        code: "GOVERNED_RUN_NOT_ADMITTED",
        correlation_id: run.value.correlation_id,
      }),
    );
  }

  return ok(run.value);
}

export function failClosedGovernedRun(
  correlation_id?: GovernedRun["correlation_id"],
): GovernedRunDenial {
  return createGovernedRunDenial({
    code: "GOVERNED_RUN_NOT_ADMITTED",
    correlation_id,
  });
}
