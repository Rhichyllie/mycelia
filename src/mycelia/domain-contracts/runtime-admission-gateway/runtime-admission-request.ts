import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  RequestIdSchema,
  RuntimeIdentityIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import { PolicyDecisionIdSchema, PolicyPurposeSchema } from "../../domain-contracts/policy-decision-gateway";
import { RuntimeEnvelopeSchema } from "../../foundation/runtime-envelope";

const MAX_RUNTIME_ADMISSION_OPAQUE_ID_LENGTH = 160;
const MAX_RUNTIME_ADMISSION_METADATA_KEYS = 32;
const MAX_RUNTIME_ADMISSION_SAFE_TEXT_LENGTH = 240;
const UNSAFE_RUNTIME_ADMISSION_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|credential|display[_-]?name|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|raw|request[_-]?internals|resource[_-]?name|role[_-]?name|secret|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;
const SAFE_RUNTIME_ADMISSION_ID_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|credential|display[_-]?name|password|private[_-]?key|raw|secret|tenant[_-]?name|token|\s)/i;

export const RuntimeAdmissionRequestIdSchema = z
  .string()
  .min(1, "admission_request_id is required.")
  .max(
    MAX_RUNTIME_ADMISSION_OPAQUE_ID_LENGTH,
    `admission_request_id must not exceed ${MAX_RUNTIME_ADMISSION_OPAQUE_ID_LENGTH} characters.`,
  )
  .refine(
    (value) => !SAFE_RUNTIME_ADMISSION_ID_PATTERN.test(value),
    "admission_request_id must be an opaque safe string.",
  );

const SafeRuntimeAdmissionMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_RUNTIME_ADMISSION_TEXT_PATTERN.test(key),
    "runtime admission metadata key is unsafe.",
  );

const SafeRuntimeAdmissionMetadataValueSchema = z.union([
  z
    .string()
    .max(MAX_RUNTIME_ADMISSION_SAFE_TEXT_LENGTH)
    .refine(
      (value) => !UNSAFE_RUNTIME_ADMISSION_TEXT_PATTERN.test(value),
      "runtime admission metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeRuntimeAdmissionMetadataSchema = z
  .record(
    SafeRuntimeAdmissionMetadataKeySchema,
    SafeRuntimeAdmissionMetadataValueSchema,
  )
  .refine(
    (metadata) =>
      Object.keys(metadata).length <= MAX_RUNTIME_ADMISSION_METADATA_KEYS,
    `runtime admission metadata must not exceed ${MAX_RUNTIME_ADMISSION_METADATA_KEYS} keys.`,
  );

export type SafeRuntimeAdmissionMetadata = z.infer<
  typeof SafeRuntimeAdmissionMetadataSchema
>;

export function isRuntimeAdmissionIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export const RuntimeAdmissionRequestSchema = z
  .object({
    admission_request_id: RuntimeAdmissionRequestIdSchema,
    tenant_id: TenantIdSchema,
    runtime_envelope: RuntimeEnvelopeSchema,
    request_id: RequestIdSchema,
    runtime_identity_id: RuntimeIdentityIdSchema,
    policy_decision_id: PolicyDecisionIdSchema.optional(),
    policy_decision: z.unknown().optional(),
    declared_purpose: PolicyPurposeSchema,
    data_classification: DataClassificationSchema,
    created_at: z.string().refine(
      isRuntimeAdmissionIsoDateTime,
      "created_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema.optional(),
    causation_id: CausationIdSchema.optional(),
    metadata: SafeRuntimeAdmissionMetadataSchema.optional(),
  })
  .strict()
  .superRefine((request, context) => {
    if (
      request.policy_decision_id === undefined &&
      request.policy_decision === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "policy decision reference or decision object is required.",
        path: ["policy_decision_id"],
      });
    }

    if (request.runtime_envelope.tenant_id !== request.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "runtime envelope tenant_id must match admission tenant_id.",
        path: ["runtime_envelope", "tenant_id"],
      });
    }

    if (request.runtime_envelope.request_id !== request.request_id) {
      context.addIssue({
        code: "custom",
        message: "request_id must match runtime envelope request_id.",
        path: ["request_id"],
      });
    }

    if (
      request.runtime_envelope.runtime_identity.runtime_identity_id !==
      request.runtime_identity_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "runtime_identity_id must match runtime envelope runtime identity.",
        path: ["runtime_identity_id"],
      });
    }

    if (request.runtime_envelope.declared_purpose !== request.declared_purpose) {
      context.addIssue({
        code: "custom",
        message: "declared purpose must match runtime envelope purpose.",
        path: ["declared_purpose"],
      });
    }

    if (
      request.runtime_envelope.data_classification !==
      request.data_classification
    ) {
      context.addIssue({
        code: "custom",
        message:
          "data classification must match runtime envelope classification.",
        path: ["data_classification"],
      });
    }

    if (
      request.correlation_id !== undefined &&
      request.runtime_envelope.correlation_id !== request.correlation_id
    ) {
      context.addIssue({
        code: "custom",
        message: "correlation_id must match runtime envelope correlation_id.",
        path: ["correlation_id"],
      });
    }

    if (
      request.policy_decision_id !== undefined &&
      request.runtime_envelope.policy_context.policy_decision_id !== undefined &&
      request.runtime_envelope.policy_context.policy_decision_id !==
        request.policy_decision_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "policy decision reference must match runtime envelope policy context.",
        path: ["policy_decision_id"],
      });
    }

    if (
      request.policy_decision_id !== undefined &&
      isRecord(request.policy_decision) &&
      typeof request.policy_decision.decision_id === "string" &&
      request.policy_decision.decision_id !== request.policy_decision_id
    ) {
      context.addIssue({
        code: "custom",
        message: "policy decision object must match its opaque reference.",
        path: ["policy_decision", "decision_id"],
      });
    }
  });

export type RuntimeAdmissionRequest = z.infer<
  typeof RuntimeAdmissionRequestSchema
>;
export type RuntimeAdmissionRequestInput = z.input<
  typeof RuntimeAdmissionRequestSchema
>;

export function isSafeRuntimeAdmissionMetadata(
  input: unknown,
): input is SafeRuntimeAdmissionMetadata {
  return SafeRuntimeAdmissionMetadataSchema.safeParse(input).success;
}
