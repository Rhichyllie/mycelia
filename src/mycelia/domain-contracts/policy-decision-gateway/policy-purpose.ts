import { z } from "zod";

const MAX_POLICY_PURPOSE_LENGTH = 240;
const MAX_POLICY_METADATA_KEYS = 32;
const UNSAFE_POLICY_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|display[_-]?name|password|permission|private[_-]?key|raw|resource[_-]?name|secret|tenant[_-]?name|token)/i;

export const PolicyPurposeSchema = z
  .string()
  .min(1, "policy purpose is required.")
  .max(
    MAX_POLICY_PURPOSE_LENGTH,
    `policy purpose must not exceed ${MAX_POLICY_PURPOSE_LENGTH} characters.`,
  )
  .refine(
    (value) => value.trim() === value,
    "policy purpose must not contain leading or trailing whitespace.",
  )
  .refine(
    (value) => !UNSAFE_POLICY_TEXT_PATTERN.test(value),
    "policy purpose must not contain unsafe content.",
  );

export type PolicyPurpose = z.infer<typeof PolicyPurposeSchema>;

const SafePolicyMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_POLICY_TEXT_PATTERN.test(key),
    "policy metadata key is unsafe.",
  );

const SafePolicyMetadataValueSchema = z.union([
  z
    .string()
    .max(240)
    .refine(
      (value) => !UNSAFE_POLICY_TEXT_PATTERN.test(value),
      "policy metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafePolicyMetadataSchema = z
  .record(SafePolicyMetadataKeySchema, SafePolicyMetadataValueSchema)
  .refine(
    (metadata) => Object.keys(metadata).length <= MAX_POLICY_METADATA_KEYS,
    `policy metadata must not exceed ${MAX_POLICY_METADATA_KEYS} keys.`,
  );

export type SafePolicyMetadata = z.infer<typeof SafePolicyMetadataSchema>;

export function isSafePolicyMetadata(
  input: unknown,
): input is SafePolicyMetadata {
  return SafePolicyMetadataSchema.safeParse(input).success;
}
