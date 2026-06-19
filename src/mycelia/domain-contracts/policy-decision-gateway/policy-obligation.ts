import { z } from "zod";

import { SafePolicyMetadataSchema } from "./policy-purpose";

export const PolicyObligationTypes = [
  "EMIT_AUDIT",
  "REQUIRE_APPROVAL",
  "HUMAN_REVIEW",
  "REDACT_PAYLOAD",
  "CAPTURE_EVIDENCE",
  "SUPPRESS_REPLAY",
] as const;

export type PolicyObligationType = (typeof PolicyObligationTypes)[number];

export const PolicyObligationTypeSchema = z.enum(PolicyObligationTypes);

export const PolicyObligationSeverities = ["REQUIRED", "ADVISORY"] as const;

export type PolicyObligationSeverity =
  (typeof PolicyObligationSeverities)[number];

export const PolicyObligationSeveritySchema = z.enum(
  PolicyObligationSeverities,
);

const PolicyObligationReasonCodeSchema = z
  .string()
  .min(1, "obligation reason_code is required when present.")
  .max(80, "obligation reason_code must not exceed 80 characters.")
  .regex(
    /^[A-Z][A-Z0-9_]*$/,
    "obligation reason_code must use safe uppercase form.",
  );

export const PolicyObligationSchema = z
  .object({
    obligation_type: PolicyObligationTypeSchema,
    severity: PolicyObligationSeveritySchema,
    reason_code: PolicyObligationReasonCodeSchema.optional(),
    metadata: SafePolicyMetadataSchema.optional(),
  })
  .strict();

export type PolicyObligation = z.infer<typeof PolicyObligationSchema>;
