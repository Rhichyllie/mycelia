import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import { validateGovernedRun } from "../../domain-contracts/governed-run";

import {
  RuntimeStateSchema,
  RuntimeStateOpaqueReferenceSchema,
  SafeRuntimeStateMetadataSchema,
  isRuntimeStateIsoDateTime,
  type RuntimeState,
} from "./runtime-state";
import {
  createRuntimeStateDenial,
  type RuntimeStateDenial,
} from "./runtime-state-denial";
import {
  RuntimeStateKindSchema,
  type RuntimeStateKind,
  isAdmittedRuntimeStateKind,
  isCancelledRuntimeStateKind,
  isCreatedRuntimeStateKind,
  isRejectedRuntimeStateKind,
} from "./runtime-state-kind";
import {
  RuntimeStateSnapshotSchema,
  type RuntimeStateSnapshot,
} from "./runtime-state-snapshot";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasInvalidVersion(input: Record<string, unknown>): boolean {
  return (
    typeof input.version !== "number" ||
    !Number.isInteger(input.version) ||
    input.version <= 0
  );
}

function hasUnsafeReference(input: Record<string, unknown>): boolean {
  return (
    (input.checkpoint_ref !== undefined &&
      !RuntimeStateOpaqueReferenceSchema.safeParse(input.checkpoint_ref)
        .success) ||
    (input.previous_state_id !== undefined &&
      !RuntimeStateOpaqueReferenceSchema.safeParse(input.previous_state_id)
        .success)
  );
}

export function validateRuntimeStateKind(
  input: unknown,
): Result<RuntimeStateKind, RuntimeStateDenial> {
  const parsed = RuntimeStateKindSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createRuntimeStateDenial({ code: "RUNTIME_STATE_KIND_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateRuntimeState(
  input: unknown,
): Result<RuntimeState, RuntimeStateDenial> {
  if (!isRecord(input)) {
    return err(createRuntimeStateDenial({ code: "RUNTIME_STATE_REQUIRED" }));
  }

  if (input.state_id === undefined) {
    return err(createRuntimeStateDenial({ code: "STATE_ID_REQUIRED" }));
  }

  if (input.run_id === undefined) {
    return err(createRuntimeStateDenial({ code: "RUN_ID_REQUIRED" }));
  }

  if (input.tenant_id === undefined) {
    return err(createRuntimeStateDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (
    input.project_id !== undefined &&
    input.workspace_id === undefined
  ) {
    return err(
      createRuntimeStateDenial({ code: "RUNTIME_STATE_SCOPE_INVALID" }),
    );
  }

  if (
    input.governed_run_ref === undefined &&
    input.governed_run === undefined
  ) {
    return err(createRuntimeStateDenial({ code: "GOVERNED_RUN_REQUIRED" }));
  }

  if (hasInvalidVersion(input)) {
    return err(
      createRuntimeStateDenial({ code: "RUNTIME_STATE_VERSION_INVALID" }),
    );
  }

  if (
    typeof input.recorded_at !== "string" ||
    !isRuntimeStateIsoDateTime(input.recorded_at)
  ) {
    return err(
      createRuntimeStateDenial({ code: "INVALID_RUNTIME_STATE_TIMESTAMP" }),
    );
  }

  if (hasUnsafeReference(input)) {
    return err(
      createRuntimeStateDenial({ code: "UNSAFE_RUNTIME_STATE_REFERENCE" }),
    );
  }

  if (
    input.metadata !== undefined &&
    !SafeRuntimeStateMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(
      createRuntimeStateDenial({ code: "UNSAFE_RUNTIME_STATE_METADATA" }),
    );
  }

  if (input.governed_run !== undefined) {
    const governedRun = validateGovernedRun(input.governed_run);

    if (!governedRun.ok) {
      return err(createRuntimeStateDenial({ code: "GOVERNED_RUN_INVALID" }));
    }
  }

  const parsed = RuntimeStateSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const issuePath = firstIssue?.path.join(".");
    const issueMessage = firstIssue?.message ?? "";

    if (issuePath === "project_id") {
      return err(
        createRuntimeStateDenial({ code: "RUNTIME_STATE_SCOPE_INVALID" }),
      );
    }

    if (issuePath?.startsWith("governed_run")) {
      if (issuePath.includes("tenant_id")) {
        return err(
          createRuntimeStateDenial({ code: "RUNTIME_STATE_TENANT_MISMATCH" }),
        );
      }

      if (issuePath.includes("run_id")) {
        return err(
          createRuntimeStateDenial({ code: "RUNTIME_STATE_RUN_MISMATCH" }),
        );
      }

      return err(createRuntimeStateDenial({ code: "GOVERNED_RUN_INVALID" }));
    }

    if (
      issuePath === "kind" ||
      issueMessage.toLowerCase().includes("kind")
    ) {
      return err(
        createRuntimeStateDenial({ code: "RUNTIME_STATE_KIND_MISMATCH" }),
      );
    }

    if (issuePath === "version") {
      return err(
        createRuntimeStateDenial({ code: "RUNTIME_STATE_VERSION_INVALID" }),
      );
    }

    if (issuePath === "recorded_at") {
      return err(
        createRuntimeStateDenial({ code: "INVALID_RUNTIME_STATE_TIMESTAMP" }),
      );
    }

    if (
      issuePath === "checkpoint_ref" ||
      issuePath === "previous_state_id"
    ) {
      return err(
        createRuntimeStateDenial({ code: "UNSAFE_RUNTIME_STATE_REFERENCE" }),
      );
    }

    return err(createRuntimeStateDenial({ code: "RUNTIME_STATE_INVALID" }));
  }

  return ok(parsed.data);
}

export function validateRuntimeStateSnapshot(
  input: unknown,
): Result<RuntimeStateSnapshot, RuntimeStateDenial> {
  if (!isRecord(input)) {
    return err(
      createRuntimeStateDenial({ code: "RUNTIME_STATE_SNAPSHOT_REQUIRED" }),
    );
  }

  if (input.state_id === undefined) {
    return err(createRuntimeStateDenial({ code: "STATE_ID_REQUIRED" }));
  }

  if (input.run_id === undefined) {
    return err(createRuntimeStateDenial({ code: "RUN_ID_REQUIRED" }));
  }

  if (input.tenant_id === undefined) {
    return err(createRuntimeStateDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (hasInvalidVersion(input)) {
    return err(
      createRuntimeStateDenial({ code: "RUNTIME_STATE_VERSION_INVALID" }),
    );
  }

  if (
    typeof input.recorded_at !== "string" ||
    !isRuntimeStateIsoDateTime(input.recorded_at)
  ) {
    return err(
      createRuntimeStateDenial({ code: "INVALID_RUNTIME_STATE_TIMESTAMP" }),
    );
  }

  if (
    input.checkpoint_ref !== undefined &&
    !RuntimeStateOpaqueReferenceSchema.safeParse(input.checkpoint_ref).success
  ) {
    return err(
      createRuntimeStateDenial({ code: "UNSAFE_RUNTIME_STATE_REFERENCE" }),
    );
  }

  if (
    input.metadata !== undefined &&
    !SafeRuntimeStateMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(
      createRuntimeStateDenial({ code: "UNSAFE_RUNTIME_STATE_METADATA" }),
    );
  }

  const parsed = RuntimeStateSnapshotSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createRuntimeStateDenial({ code: "RUNTIME_STATE_SNAPSHOT_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function isRuntimeStateCreated(input: unknown): boolean {
  const state = validateRuntimeState(input);

  return state.ok && isCreatedRuntimeStateKind(state.value.kind);
}

export function isRuntimeStateAdmitted(input: unknown): boolean {
  const state = validateRuntimeState(input);

  return state.ok && isAdmittedRuntimeStateKind(state.value.kind);
}

export function isRuntimeStateRejected(input: unknown): boolean {
  const state = validateRuntimeState(input);

  return state.ok && isRejectedRuntimeStateKind(state.value.kind);
}

export function isRuntimeStateCancelled(input: unknown): boolean {
  const state = validateRuntimeState(input);

  return state.ok && isCancelledRuntimeStateKind(state.value.kind);
}

export function ensureRuntimeStateTenantMatchesRun(
  state: RuntimeState,
): Result<true, RuntimeStateDenial> {
  if (
    state.governed_run !== undefined &&
    state.governed_run.tenant_id !== state.tenant_id
  ) {
    return err(
      createRuntimeStateDenial({
        code: "RUNTIME_STATE_TENANT_MISMATCH",
        correlation_id: state.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureRuntimeStateKindMatchesRunStatus(
  state: RuntimeState,
): Result<true, RuntimeStateDenial> {
  if (
    state.governed_run !== undefined &&
    state.governed_run.status !== state.kind
  ) {
    return err(
      createRuntimeStateDenial({
        code: "RUNTIME_STATE_KIND_MISMATCH",
        correlation_id: state.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureRuntimeStateSnapshotMatchesState(
  snapshot: RuntimeStateSnapshot,
  state: RuntimeState,
): Result<true, RuntimeStateDenial> {
  if (
    snapshot.state_id !== state.state_id ||
    snapshot.run_id !== state.run_id ||
    snapshot.tenant_id !== state.tenant_id ||
    snapshot.version !== state.version
  ) {
    return err(
      createRuntimeStateDenial({
        code: "RUNTIME_STATE_SNAPSHOT_MISMATCH",
        correlation_id: state.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertRuntimeStateUsable(
  input: unknown,
): Result<RuntimeState, RuntimeStateDenial> {
  return validateRuntimeState(input);
}

export function failClosedRuntimeState(
  correlation_id?: RuntimeState["correlation_id"],
): RuntimeStateDenial {
  return createRuntimeStateDenial({
    code: "RUNTIME_STATE_INVALID",
    correlation_id,
  });
}
