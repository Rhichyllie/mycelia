import { z } from "zod";

import {
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  TenantIdSchema,
} from "../shared-kernel";

const MAX_AUDIT_REF_LENGTH = 160;
const MAX_AUDIT_METADATA_KEYS = 32;
const MAX_AUDIT_SAFE_TEXT_LENGTH = 240;
const UNSAFE_AUDIT_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|evidence[_-]?internals|event[_-]?internals|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|raw|run[_-]?internals|secret|security[_-]?boundary[_-]?internals|state[_-]?internals|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;
const SAFE_AUDIT_REF_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|evidence[_-]?internals|password|private[_-]?key|raw|secret|tenant[_-]?name|token|\s)/i;
const UNSAFE_AUDIT_MESSAGE_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|evidence[_-]?internals|event[_-]?internals|external[_-]?id|password|permission|policy[_-]?internals|private[_-]?key|raw|run[_-]?internals|secret|security[_-]?boundary[_-]?internals|state[_-]?internals|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name)/i;

export const AuditOpaqueReferenceSchema = z
  .string()
  .min(1, "audit reference must be non-empty.")
  .max(
    MAX_AUDIT_REF_LENGTH,
    `audit reference must not exceed ${MAX_AUDIT_REF_LENGTH} characters.`,
  )
  .refine(
    (value) => !SAFE_AUDIT_REF_PATTERN.test(value),
    "audit reference must be opaque and safe.",
  );

export const AuditReasonCodeSchema = z
  .string()
  .min(1, "reason_code is required.")
  .max(80, "reason_code must not exceed 80 characters.")
  .regex(/^[A-Z][A-Z0-9_]*$/, "reason_code must use safe uppercase form.");

export const AuditMessageSchema = z
  .string()
  .min(1, "message is required.")
  .max(240, "message must not exceed 240 characters.")
  .refine(
    (value) => !UNSAFE_AUDIT_MESSAGE_PATTERN.test(value),
    "message must be safe and non-enumerating.",
  );

const SafeAuditMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_AUDIT_TEXT_PATTERN.test(key),
    "audit metadata key is unsafe.",
  );

const SafeAuditMetadataValueSchema = z.union([
  z
    .string()
    .max(MAX_AUDIT_SAFE_TEXT_LENGTH)
    .refine(
      (value) => !UNSAFE_AUDIT_TEXT_PATTERN.test(value),
      "audit metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeAuditMetadataSchema = z
  .record(SafeAuditMetadataKeySchema, SafeAuditMetadataValueSchema)
  .refine(
    (metadata) => Object.keys(metadata).length <= MAX_AUDIT_METADATA_KEYS,
    `audit metadata must not exceed ${MAX_AUDIT_METADATA_KEYS} keys.`,
  );

export type AuditOpaqueReference = z.infer<typeof AuditOpaqueReferenceSchema>;
export type SafeAuditMetadata = z.infer<typeof SafeAuditMetadataSchema>;

export function isAuditIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

export const AuditEvidenceKinds = [
  "DESCRIPTOR_ONLY",
  "VALIDATION_RESULT",
  "DENIAL_RESULT",
  "DECISION_RESULT",
  "COORDINATION_RESULT",
  "SNAPSHOT_DESCRIPTOR",
] as const;

export type AuditEvidenceKind = (typeof AuditEvidenceKinds)[number];

export const AuditEvidenceKindSchema = z.enum(AuditEvidenceKinds);

export const AuditEvidenceRefSchema = z
  .object({
    evidence_ref_id: AuditOpaqueReferenceSchema,
    tenant_id: TenantIdSchema,
    evidence_kind: AuditEvidenceKindSchema,
    created_at: z
      .string()
      .refine(
        isAuditIsoDateTime,
        "created_at must be an ISO datetime string.",
      ),
    data_classification: DataClassificationSchema,
    correlation_id: CorrelationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict();

export type AuditEvidenceRef = z.infer<typeof AuditEvidenceRefSchema>;
export type AuditEvidenceRefInput = z.input<typeof AuditEvidenceRefSchema>;
