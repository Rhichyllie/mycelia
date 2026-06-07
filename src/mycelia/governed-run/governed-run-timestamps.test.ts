import { describe, expect, it } from "vitest";

import { validateGovernedRun } from ".";
import {
  validAdmissionDecision,
  validGovernedRun,
} from "./governed-run.test";

describe("GovernedRun timestamp and status consistency", () => {
  it("rejects admitted_at before created_at", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        status: "ADMITTED",
        admission_decision: validAdmissionDecision("ADMIT"),
        admitted_at: "2026-05-31T23:59:59.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_GOVERNED_RUN_TIMESTAMP");
    }
  });

  it("rejects rejected_at before created_at", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        status: "REJECTED",
        admission_decision: validAdmissionDecision("DENY"),
        rejected_at: "2026-05-31T23:59:59.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_GOVERNED_RUN_TIMESTAMP");
    }
  });

  it("rejects cancelled_at before created_at", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        status: "CANCELLED",
        cancelled_at: "2026-05-31T23:59:59.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_GOVERNED_RUN_TIMESTAMP");
    }
  });

  it("rejects admitted_at on non-ADMITTED status", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        admitted_at: "2026-06-01T00:00:03.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_GOVERNED_RUN_TIMESTAMP");
    }
  });

  it("rejects rejected_at on non-REJECTED status", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        rejected_at: "2026-06-01T00:00:03.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_GOVERNED_RUN_TIMESTAMP");
    }
  });

  it("rejects cancelled_at on non-CANCELLED status", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        cancelled_at: "2026-06-01T00:00:03.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_GOVERNED_RUN_TIMESTAMP");
    }
  });
});
