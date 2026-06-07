import { z } from "zod";

import { TenantIdSchema } from "../shared-kernel";

import { PolicyDecisionRequestIdSchema } from "./policy-decision-request";
import { PolicyObligationSchema } from "./policy-obligation";

export const PolicyDecisionOutcomes = [
  "ALLOW",
  "DENY",
  "REQUIRE_APPROVAL",
  "ABSTAIN",
  "NOT_APPLICABLE",
] as const;

export type PolicyDecisionOutcome = (typeof PolicyDecisionOutcomes)[number];

export const PolicyDecisionOutcomeSchema = z.enum(PolicyDecisionOutcomes);

const MAX_POLICY_OPAQUE_REF_LENGTH = 160;
const SAFE_POLICY_REF_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|password|private[_-]?key|raw|secret|token|\s)/i;

export const PolicyDecisionIdSchema = z
  .string()
  .min(1, "decision_id is required.")
  .max(
    MAX_POLICY_OPAQUE_REF_LENGTH,
    `decision_id must not exceed ${MAX_POLICY_OPAQUE_REF_LENGTH} characters.`,
  )
  .refine(
    (value) => !SAFE_POLICY_REF_PATTERN.test(value),
    "decision_id must be an opaque safe string.",
  );

export const PolicyBasisRefSchema = z
  .string()
  .min(1, "policy_basis_ref is required.")
  .max(
    MAX_POLICY_OPAQUE_REF_LENGTH,
    `policy_basis_ref must not exceed ${MAX_POLICY_OPAQUE_REF_LENGTH} characters.`,
  )
  .refine(
    (value) => !SAFE_POLICY_REF_PATTERN.test(value),
    "policy_basis_ref must be an opaque safe reference.",
  );

export const PolicyReasonCodeSchema = z
  .string()
  .min(1, "reason_code is required.")
  .max(80, "reason_code must not exceed 80 characters.")
  .regex(/^[A-Z][A-Z0-9_]*$/, "reason_code must use safe uppercase form.");

const UNSAFE_POLICY_MESSAGE_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|display[_-]?name|password|permission|policy[_-]?internals|private[_-]?key|raw|resource[_-]?name|role[_-]?name|secret|tenant[_-]?name|token)/i;

export const PolicyDecisionMessageSchema = z
  .string()
  .min(1, "message is required.")
  .max(240, "message must not exceed 240 characters.")
  .refine(
    (value) => !UNSAFE_POLICY_MESSAGE_PATTERN.test(value),
    "message must be safe and non-enumerating.",
  );

function isIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

export const PolicyDecisionSchema = z
  .object({
    decision_id: PolicyDecisionIdSchema,
    decision_request_id: PolicyDecisionRequestIdSchema,
    tenant_id: TenantIdSchema,
    outcome: PolicyDecisionOutcomeSchema,
    obligations: z.array(PolicyObligationSchema).max(32),
    policy_basis_ref: PolicyBasisRefSchema,
    decided_at: z
      .string()
      .refine(isIsoDateTime, "decided_at must be an ISO datetime string."),
    reason_code: PolicyReasonCodeSchema,
    message: PolicyDecisionMessageSchema,
  })
  .strict();

export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
export type PolicyDecisionInput = z.input<typeof PolicyDecisionSchema>;
