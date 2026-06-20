import { z } from "zod";

import { DataClassificationSchema } from "../../foundation/shared-kernel";

const MAX_METADATA_KEYS = 32;
const MAX_SAFE_TEXT_LENGTH = 240;
const UNSAFE_EVENT_CONTENT_PATTERN =
  /(authorization|api[_-]?key|bearer|credential|password|private[_-]?key|raw[_-]?memory[_-]?fragment|raw[_-]?model[_-]?output|raw[_-]?prompt|raw[_-]?tool[_-]?payload|secret|token)/i;
const UNSAFE_REFERENCE_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|password|private[_-]?key|raw|secret|token|\s)/i;

export const EventRedactionStatuses = [
  "NO_RAW_PAYLOAD",
  "REDACTED",
  "SAFE_SUMMARY_ONLY",
  "EXTERNALIZED_REFERENCE",
] as const;

export type EventRedactionStatus = (typeof EventRedactionStatuses)[number];

export const EventRedactionStatusSchema = z.enum(EventRedactionStatuses);

export const EventPayloadRefSchema = z
  .string()
  .min(1, "payload_ref must be a non-empty opaque reference.")
  .max(240, "payload_ref must not exceed 240 characters.")
  .refine(
    (value) => !UNSAFE_REFERENCE_PATTERN.test(value),
    "payload_ref must not contain raw payloads or sensitive content.",
  );

export type EventPayloadRef = z.infer<typeof EventPayloadRefSchema>;

export const EventPayloadHashSchema = z
  .string()
  .min(1, "payload_hash must be non-empty when present.")
  .max(160, "payload_hash must not exceed 160 characters.")
  .refine(
    (value) => !UNSAFE_EVENT_CONTENT_PATTERN.test(value),
    "payload_hash must be safe.",
  );

const PayloadSchemaVersionSchema = z
  .string()
  .min(1, "payload_schema_version must be non-empty when present.")
  .max(40, "payload_schema_version must not exceed 40 characters.")
  .regex(/^\d+\.\d+\.\d+$/, "payload_schema_version must use semver form.");

const SafeEventMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_EVENT_CONTENT_PATTERN.test(key),
    "metadata key is unsafe.",
  );

const SafeEventMetadataValueSchema = z.union([
  z
    .string()
    .max(MAX_SAFE_TEXT_LENGTH)
    .refine(
      (value) => !UNSAFE_EVENT_CONTENT_PATTERN.test(value),
      "metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeEventMetadataSchema = z
  .record(SafeEventMetadataKeySchema, SafeEventMetadataValueSchema)
  .refine(
    (metadata) => Object.keys(metadata).length <= MAX_METADATA_KEYS,
    `metadata must not exceed ${MAX_METADATA_KEYS} keys.`,
  );

export type SafeEventMetadata = z.infer<typeof SafeEventMetadataSchema>;

const SafeSummarySchema = z
  .string()
  .min(1, "safe_summary must be non-empty when present.")
  .max(MAX_SAFE_TEXT_LENGTH)
  .refine(
    (value) => !UNSAFE_EVENT_CONTENT_PATTERN.test(value),
    "safe_summary must not contain sensitive content.",
  );

export const EventPayloadDescriptorSchema = z
  .object({
    payload_ref: EventPayloadRefSchema.optional(),
    payload_hash: EventPayloadHashSchema.optional(),
    payload_schema_version: PayloadSchemaVersionSchema.optional(),
    payload_classification: DataClassificationSchema,
    redaction_status: EventRedactionStatusSchema,
    safe_summary: SafeSummarySchema.optional(),
  })
  .strict();

export type EventPayloadDescriptor = z.infer<
  typeof EventPayloadDescriptorSchema
>;

export function isSafeEventMetadata(input: unknown): input is SafeEventMetadata {
  return SafeEventMetadataSchema.safeParse(input).success;
}
