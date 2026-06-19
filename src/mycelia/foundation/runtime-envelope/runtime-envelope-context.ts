import { z } from "zod";

import {
  ActorIdSchema,
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  PolicySnapshotIdSchema,
  RequestIdSchema,
} from "../../foundation/shared-kernel";
import {
  RuntimeActorSchema,
  RuntimeExecutionIdentitySchema,
} from "../../foundation/runtime-identity";
import {
  PolicyBasisRefSchema,
  PolicyDecisionIdSchema,
  PolicyDecisionRequestIdSchema,
  PolicyPurposeSchema,
} from "../../domain-contracts/policy-decision-gateway";

import { RuntimeEnvelopeModeSchema } from "./runtime-envelope-mode";

const MAX_RUNTIME_ENVELOPE_METADATA_KEYS = 32;
const MAX_RUNTIME_ENVELOPE_SAFE_TEXT_LENGTH = 240;
const UNSAFE_RUNTIME_ENVELOPE_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|display[_-]?name|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|raw|request[_-]?internals|resource[_-]?name|secret|tenant[_-]?name|token)/i;
const SAFE_OPAQUE_REFERENCE_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|display[_-]?name|password|private[_-]?key|raw|secret|tenant[_-]?name|token|\s)/i;

export const RuntimeEnvelopeOpaqueReferenceSchema = z
  .string()
  .min(1, "opaque reference must be non-empty.")
  .max(160, "opaque reference must not exceed 160 characters.")
  .refine(
    (value) => !SAFE_OPAQUE_REFERENCE_PATTERN.test(value),
    "opaque reference must not contain unsafe or identifying content.",
  );

export type RuntimeEnvelopeOpaqueReference = z.infer<
  typeof RuntimeEnvelopeOpaqueReferenceSchema
>;

const SafeRuntimeEnvelopeMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_RUNTIME_ENVELOPE_TEXT_PATTERN.test(key),
    "runtime envelope metadata key is unsafe.",
  );

const SafeRuntimeEnvelopeMetadataValueSchema = z.union([
  z
    .string()
    .max(MAX_RUNTIME_ENVELOPE_SAFE_TEXT_LENGTH)
    .refine(
      (value) => !UNSAFE_RUNTIME_ENVELOPE_TEXT_PATTERN.test(value),
      "runtime envelope metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeRuntimeEnvelopeMetadataSchema = z
  .record(
    SafeRuntimeEnvelopeMetadataKeySchema,
    SafeRuntimeEnvelopeMetadataValueSchema,
  )
  .refine(
    (metadata) =>
      Object.keys(metadata).length <= MAX_RUNTIME_ENVELOPE_METADATA_KEYS,
    `runtime envelope metadata must not exceed ${MAX_RUNTIME_ENVELOPE_METADATA_KEYS} keys.`,
  );

export type SafeRuntimeEnvelopeMetadata = z.infer<
  typeof SafeRuntimeEnvelopeMetadataSchema
>;

export const RuntimeEnvelopePolicyContextSchema = z
  .object({
    decision_request_id: PolicyDecisionRequestIdSchema.optional(),
    policy_decision_id: PolicyDecisionIdSchema.optional(),
    policy_snapshot_id: PolicySnapshotIdSchema.optional(),
    policy_basis_ref: PolicyBasisRefSchema.optional(),
  })
  .strict()
  .refine(
    (context) =>
      context.decision_request_id !== undefined ||
      context.policy_decision_id !== undefined ||
      context.policy_snapshot_id !== undefined ||
      context.policy_basis_ref !== undefined,
    "policy context requires at least one opaque policy reference.",
  );

export type RuntimeEnvelopePolicyContext = z.infer<
  typeof RuntimeEnvelopePolicyContextSchema
>;

export function isRuntimeEnvelopeIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function isAfterIsoDateTime(left: string, right: string): boolean {
  return Date.parse(left) > Date.parse(right);
}

export const RuntimeEnvelopeContextSchema = z
  .object({
    request_id: RequestIdSchema,
    runtime_identity: RuntimeExecutionIdentitySchema,
    actor: RuntimeActorSchema.optional(),
    actor_id: ActorIdSchema.optional(),
    policy_context: RuntimeEnvelopePolicyContextSchema,
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    source_event_ref: RuntimeEnvelopeOpaqueReferenceSchema.optional(),
    declared_purpose: PolicyPurposeSchema,
    data_classification: DataClassificationSchema,
    mode: RuntimeEnvelopeModeSchema,
    created_at: z
      .string()
      .refine(
        isRuntimeEnvelopeIsoDateTime,
        "created_at must be an ISO datetime string.",
      ),
    expires_at: z
      .string()
      .refine(
        isRuntimeEnvelopeIsoDateTime,
        "expires_at must be an ISO datetime string.",
      )
      .optional(),
    is_replay: z.boolean().optional(),
    replay_suppression_active: z.boolean().optional(),
    is_investigation: z.boolean().optional(),
    metadata: SafeRuntimeEnvelopeMetadataSchema.optional(),
  })
  .strict()
  .superRefine((context, refinementContext) => {
    if (
      context.expires_at !== undefined &&
      !isAfterIsoDateTime(context.expires_at, context.created_at)
    ) {
      refinementContext.addIssue({
        code: "custom",
        message: "expires_at must be after created_at.",
        path: ["expires_at"],
      });
    }

    if (
      context.mode === "PRODUCTION" &&
      (context.is_replay === true ||
        context.replay_suppression_active === true ||
        context.is_investigation === true)
    ) {
      refinementContext.addIssue({
        code: "custom",
        message: "production runtime envelopes must not carry replay flags.",
        path: ["mode"],
      });
    }

    if (context.mode === "REPLAY" && context.is_replay !== true) {
      refinementContext.addIssue({
        code: "custom",
        message: "replay runtime envelopes require is_replay.",
        path: ["is_replay"],
      });
    }

    if (
      context.mode === "REPLAY" &&
      context.replay_suppression_active !== true
    ) {
      refinementContext.addIssue({
        code: "custom",
        message: "replay runtime envelopes require replay suppression.",
        path: ["replay_suppression_active"],
      });
    }

    if (context.is_replay === true && context.mode !== "REPLAY") {
      refinementContext.addIssue({
        code: "custom",
        message: "is_replay is only valid for replay runtime envelopes.",
        path: ["is_replay"],
      });
    }

    if (
      context.is_investigation === true &&
      context.mode !== "INVESTIGATION"
    ) {
      refinementContext.addIssue({
        code: "custom",
        message:
          "is_investigation is only valid for investigation runtime envelopes.",
        path: ["is_investigation"],
      });
    }
  });

export type RuntimeEnvelopeContext = z.infer<
  typeof RuntimeEnvelopeContextSchema
>;

export function isSafeRuntimeEnvelopeMetadata(
  input: unknown,
): input is SafeRuntimeEnvelopeMetadata {
  return SafeRuntimeEnvelopeMetadataSchema.safeParse(input).success;
}
