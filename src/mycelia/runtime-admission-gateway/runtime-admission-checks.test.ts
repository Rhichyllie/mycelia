import { describe, expect, it } from "vitest";

import {
  assertRuntimeAdmissionAdmitted,
  createRuntimeAdmissionDenial,
  evaluateRuntimeAdmission,
  isRuntimeAdmissionAdmitted,
  isRuntimeAdmissionDenied,
  requiresRuntimeAdmissionApproval,
} from ".";
import {
  validAdmissionRequest,
  validPolicyDecision,
  validRuntimeEnvelope,
} from "./runtime-admission-request.test";

describe("RuntimeAdmissionGateway checks", () => {
  it("admits a valid request with an ALLOW policy decision", () => {
    const result = evaluateRuntimeAdmission(validAdmissionRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("ADMIT");
      expect(isRuntimeAdmissionAdmitted(result.value)).toBe(true);
    }
  });

  it("rejects policy decision tenant mismatch", () => {
    const result = evaluateRuntimeAdmission(
      validAdmissionRequest({
        policy_decision: {
          ...validPolicyDecision(),
          tenant_id: "tenant_002",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("POLICY_DECISION_TENANT_MISMATCH");
    }
  });

  it("blocks DENY policy decisions", () => {
    const result = evaluateRuntimeAdmission(
      validAdmissionRequest({
        policy_decision: {
          ...validPolicyDecision("DENY"),
          reason_code: "POLICY_DENIED",
          message: "The operation is denied.",
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("DENY");
      expect(isRuntimeAdmissionDenied(result.value)).toBe(true);
      expect(isRuntimeAdmissionAdmitted(result.value)).toBe(false);
    }
  });

  it("returns approval-required outcome without treating it as admitted", () => {
    const result = evaluateRuntimeAdmission(
      validAdmissionRequest({
        policy_decision: {
          ...validPolicyDecision("REQUIRE_APPROVAL"),
          obligations: [
            {
              obligation_type: "REQUIRE_APPROVAL",
              severity: "REQUIRED",
              reason_code: "APPROVAL_REQUIRED",
            },
          ],
          reason_code: "POLICY_APPROVAL_REQUIRED",
          message: "The operation requires approval.",
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("REQUIRE_APPROVAL");
      expect(requiresRuntimeAdmissionApproval(result.value)).toBe(true);
      expect(isRuntimeAdmissionAdmitted(result.value)).toBe(false);
    }
  });

  it.each(["ABSTAIN", "NOT_APPLICABLE"] as const)(
    "fails closed for %s policy decisions",
    (outcome) => {
      const result = evaluateRuntimeAdmission(
        validAdmissionRequest({
          policy_decision: {
            ...validPolicyDecision(outcome),
            reason_code: "POLICY_FAIL_CLOSED",
            message: "The operation is denied.",
          },
        }),
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.outcome).toBe("DENY");
        expect(isRuntimeAdmissionAdmitted(result.value)).toBe(false);
      }
    },
  );

  it("fails closed when the policy decision object is missing", () => {
    const result = evaluateRuntimeAdmission(
      validAdmissionRequest({
        policy_decision: undefined,
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("DENY");
      expect(result.value.reason_code).toBe("RUNTIME_ADMISSION_FAIL_CLOSED");
    }
  });

  it("fails closed when the policy decision object is malformed", () => {
    const result = evaluateRuntimeAdmission(
      validAdmissionRequest({
        policy_decision: {
          decision_id: "policy_decision_001",
          outcome: "ALLOW",
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("DENY");
    }
  });

  it.each([
    {
      mode: "REPLAY",
      flags: {
        is_replay: true,
        replay_suppression_active: true,
      },
    },
    { mode: "EVALUATION", flags: {} },
    { mode: "TEST", flags: {} },
    {
      mode: "INVESTIGATION",
      flags: {
        is_investigation: true,
      },
    },
  ] as const)(
    "does not admit %s envelopes for production side-effect admission",
    ({ mode, flags }) => {
      const result = evaluateRuntimeAdmission(
        validAdmissionRequest({
          runtime_envelope: {
            ...validRuntimeEnvelope(),
            mode,
            ...flags,
          },
        }),
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.outcome).toBe("DENY");
        expect(isRuntimeAdmissionAdmitted(result.value)).toBe(false);
      }
    },
  );

  it("carries obligations as typed descriptors without executing them", () => {
    const result = evaluateRuntimeAdmission(
      validAdmissionRequest({
        policy_decision: {
          ...validPolicyDecision(),
          obligations: [
            {
              obligation_type: "EMIT_AUDIT",
              severity: "REQUIRED",
              reason_code: "AUDIT_REQUIRED",
            },
            {
              obligation_type: "CAPTURE_EVIDENCE",
              severity: "ADVISORY",
              reason_code: "EVIDENCE_CAPTURE",
            },
          ],
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.obligations).toHaveLength(2);
      expect(result.value).not.toHaveProperty("obligations_executed");
    }
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createRuntimeAdmissionDenial({
      code: "POLICY_DECISION_TENANT_MISMATCH",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("permission");
  });

  it("fails closed when an admission decision is missing", () => {
    expect(isRuntimeAdmissionDenied(undefined)).toBe(true);

    const assertion = assertRuntimeAdmissionAdmitted(undefined);

    expect(assertion.ok).toBe(false);
    if (!assertion.ok) {
      expect(assertion.error.code).toBe("RUNTIME_ADMISSION_DECISION_REQUIRED");
    }
  });
});
