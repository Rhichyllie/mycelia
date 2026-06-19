import { describe, expect, it } from "vitest";

import {
  ensureRuntimeStateSnapshotMatchesState,
  validateRuntimeState,
  validateRuntimeStateSnapshot,
} from ".";
import type { RuntimeStateSnapshotInput } from "./runtime-state-snapshot";
import { validRuntimeState } from "./runtime-state.test";

function validRuntimeStateSnapshot(
  overrides: Partial<RuntimeStateSnapshotInput> = {},
): RuntimeStateSnapshotInput {
  return {
    snapshot_id: "runtime_state_snapshot_001",
    state_id: "runtime_state_001",
    run_id: "run_001",
    tenant_id: "tenant_001",
    version: 1,
    recorded_at: "2026-06-01T00:00:04.000Z",
    data_classification: "INTERNAL",
    checkpoint_ref: "checkpoint_ref_001",
    metadata: {
      phase: "one_i",
    },
    ...overrides,
  };
}

describe("RuntimeStateSnapshot", () => {
  it("accepts a valid runtime state snapshot descriptor", () => {
    const result = validateRuntimeStateSnapshot(validRuntimeStateSnapshot());

    expect(result.ok).toBe(true);
  });

  it("rejects invalid runtime state snapshot version", () => {
    const result = validateRuntimeStateSnapshot(
      validRuntimeStateSnapshot({
        version: 0,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_STATE_VERSION_INVALID");
    }
  });

  it("rejects snapshot tenant/run mismatch when linked to a state", () => {
    const state = validateRuntimeState(validRuntimeState());
    const snapshot = validateRuntimeStateSnapshot(
      validRuntimeStateSnapshot({
        tenant_id: "tenant_002",
      }),
    );

    expect(state.ok).toBe(true);
    expect(snapshot.ok).toBe(true);

    if (state.ok && snapshot.ok) {
      const result = ensureRuntimeStateSnapshotMatchesState(
        snapshot.value,
        state.value,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("RUNTIME_STATE_SNAPSHOT_MISMATCH");
      }
    }
  });
});
