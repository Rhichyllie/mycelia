import { z } from "zod";

import { CorrelationIdSchema, TenantIdSchema } from "../shared-kernel";
import { PolicyObligationSchema } from "../policy-decision-gateway";

import {
  RuntimeAdmissionRequestIdSchema,
  isRuntimeAdmissionIsoDateTime,
} from "./runtime-admission-request";

export const RuntimeAdmissionOutcomes = [
  "ADMIT",
  "DENY",
  "REQUIRE_APPROVAL",
] as const;

export type RuntimeAdmissionOutcome =
  (typeof RuntimeAdmissionOutcomes)[number];

export const RuntimeAdmissionOutcomeSchema = z.enum(
  RuntimeAdmissionOutcomes,
);

const MAX_RUNTIME_ADMISSION_OPAQUE_ID_LENGTH = 160;
const SAFE_RUNTIME_ADMISSION_REF_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|authorization|api[_-]?key|bearer|credential|display[_-]?name|password|private[_-]?key|raw|secret|tenant[_-]?name|token|\s)/i;

export const RuntimeAdmissionDecisionIdSchema = z
  .string()
  .min(1, "admission_decision_id is required.")
  .max(
    MAX_RUNTIME_ADMISSION_OPAQUE_ID_LENGTH,
    `admission_decision_id must not exceed ${MAX_RUNTIME_ADMISSION_OPAQUE_ID_LENGTH} characters.`,
  )
  .refine(
    (value) => !SAFE_RUNTIME_ADMISSION_REF_PATTERN.test(value),
    "admission_decision_id must be an opaque safe string.",
  );

export const RuntimeAdmissionReasonCodeSchema = z
  .string()
  .min(1, "reason_code is required.")
  .max(80, "reason_code must not exceed 80 characters.")
  .regex(/^[A-Z][A-Z0-9_]*$/, "reason_code must use safe uppercase form.");

const UNSAFE_RUNTIME_ADMISSION_MESSAGE_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|display[_-]?name|password|permission|policy[_-]?internals|private[_-]?key|raw|resource[_-]?name|role[_-]?name|secret|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name)/i;

export const RuntimeAdmissionDecisionMessageSchema = z
  .string()
  .min(1, "message is required.")
  .max(240, "message must not exceed 240 characters.")
  .refine(
    (value) => !UNSAFE_RUNTIME_ADMISSION_MESSAGE_PATTERN.test(value),
    "message must be safe and non-enumerating.",
  );

export const RuntimeAdmissionDecisionSchema = z
  .object({
    admission_decision_id: RuntimeAdmissionDecisionIdSchema,
    admission_request_id: RuntimeAdmissionRequestIdSchema,
    tenant_id: TenantIdSchema,
    outcome: RuntimeAdmissionOutcomeSchema,
    decided_at: z.string().refine(
      isRuntimeAdmissionIsoDateTime,
      "decided_at must be an ISO datetime string.",
    ),
    reason_code: RuntimeAdmissionReasonCodeSchema,
    message: RuntimeAdmissionDecisionMessageSchema,
    correlation_id: CorrelationIdSchema.optional(),
    obligations: z.array(PolicyObligationSchema).max(32).optional(),
  })
  .strict();

export type RuntimeAdmissionDecision = z.infer<
  typeof RuntimeAdmissionDecisionSchema
>;
export type RuntimeAdmissionDecisionInput = z.input<
  typeof RuntimeAdmissionDecisionSchema
>;
