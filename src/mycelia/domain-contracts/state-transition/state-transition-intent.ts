import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  RunIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import { PolicyPurposeSchema } from "../../domain-contracts/policy-decision-gateway";
import {
  RuntimeStateIdSchema,
  RuntimeStateKindSchema,
  RuntimeStateOpaqueReferenceSchema,
} from "../../domain-contracts/runtime-state";

const MAX_STATE_TRANSITION_REF_LENGTH = 160;
const MAX_STATE_TRANSITION_METADATA_KEYS = 32;
const MAX_STATE_TRANSITION_SAFE_TEXT_LENGTH = 240;
const UNSAFE_STATE_TRANSITION_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|event[_-]?internals|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|raw|run[_-]?internals|secret|state[_-]?internals|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;
const SAFE_STATE_TRANSITION_REF_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|password|private[_-]?key|raw|secret|state[_-]?internals|tenant[_-]?name|token|\s)/i;

export const StateTransitionOpaqueReferenceSchema = z
  .string()
  .min(1, "state transition reference must be non-empty.")
  .max(
    MAX_STATE_TRANSITION_REF_LENGTH,
    `state transition reference must not exceed ${MAX_STATE_TRANSITION_REF_LENGTH} characters.`,
  )
  .refine(
    (value) => !SAFE_STATE_TRANSITION_REF_PATTERN.test(value),
    "state transition reference must be opaque and safe.",
  );

export const StateTransitionIntentIdSchema =
  StateTransitionOpaqueReferenceSchema;

export const StateTransitionReasonCodeSchema = z
  .string()
  .min(1, "reason_code is required.")
  .max(80, "reason_code must not exceed 80 characters.")
  .regex(/^[A-Z][A-Z0-9_]*$/, "reason_code must use safe uppercase form.");

const SafeStateTransitionMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_STATE_TRANSITION_TEXT_PATTERN.test(key),
    "state transition metadata key is unsafe.",
  );

const SafeStateTransitionMetadataValueSchema = z.union([
  z
    .string()
    .max(MAX_STATE_TRANSITION_SAFE_TEXT_LENGTH)
    .refine(
      (value) => !UNSAFE_STATE_TRANSITION_TEXT_PATTERN.test(value),
      "state transition metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeStateTransitionMetadataSchema = z
  .record(
    SafeStateTransitionMetadataKeySchema,
    SafeStateTransitionMetadataValueSchema,
  )
  .refine(
    (metadata) =>
      Object.keys(metadata).length <= MAX_STATE_TRANSITION_METADATA_KEYS,
    `state transition metadata must not exceed ${MAX_STATE_TRANSITION_METADATA_KEYS} keys.`,
  );

export type StateTransitionOpaqueReference = z.infer<
  typeof StateTransitionOpaqueReferenceSchema
>;
export type StateTransitionIntentId = z.infer<
  typeof StateTransitionIntentIdSchema
>;
export type SafeStateTransitionMetadata = z.infer<
  typeof SafeStateTransitionMetadataSchema
>;

export function isStateTransitionIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

export const StateTransitionIntentSchema = z
  .object({
    transition_intent_id: StateTransitionIntentIdSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    from_state_id: RuntimeStateIdSchema,
    from_kind: RuntimeStateKindSchema,
    to_kind: RuntimeStateKindSchema,
    expected_from_version: z
      .number()
      .int("expected_from_version must be an integer.")
      .positive("expected_from_version must be positive."),
    requested_by: RuntimeStateOpaqueReferenceSchema,
    reason_code: StateTransitionReasonCodeSchema,
    declared_purpose: PolicyPurposeSchema,
    data_classification: DataClassificationSchema,
    requested_at: z.string().refine(
      isStateTransitionIsoDateTime,
      "requested_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeStateTransitionMetadataSchema.optional(),
  })
  .strict();

export type StateTransitionIntent = z.infer<
  typeof StateTransitionIntentSchema
>;
export type StateTransitionIntentInput = z.input<
  typeof StateTransitionIntentSchema
>;
