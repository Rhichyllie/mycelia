import { z } from "zod";

import {
  CorrelationIdSchema,
  DataClassificationSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditOpaqueReferenceSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";

const UNSAFE_AUDIT_TIMELINE_CURSOR_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection|credential|cursor[_-]?internals|database|filesystem|password|path|private[_-]?key|query|raw|secret|sql|storage|token)/i;

const SafeAuditTimelineCursorMetadataSchema = SafeAuditMetadataSchema.refine(
  (metadata) =>
    Object.entries(metadata).every(([key, value]) => {
      if (UNSAFE_AUDIT_TIMELINE_CURSOR_PATTERN.test(key)) {
        return false;
      }

      return (
        typeof value !== "string" ||
        !UNSAFE_AUDIT_TIMELINE_CURSOR_PATTERN.test(value)
      );
    }),
  "audit timeline cursor metadata must not expose storage or query details.",
);

export const AuditTimelineCursorIdSchema = AuditOpaqueReferenceSchema;

export const AuditTimelineCursorSchema = z
  .object({
    cursor_id: AuditTimelineCursorIdSchema,
    tenant_id: TenantIdSchema,
    timeline_id: AuditOpaqueReferenceSchema,
    position_sequence_number: z
      .number()
      .int("position_sequence_number must be an integer.")
      .nonnegative("position_sequence_number must be non-negative."),
    created_at: z.string().refine(
      isAuditIsoDateTime,
      "created_at must be an ISO datetime string.",
    ),
    data_classification: DataClassificationSchema,
    correlation_id: CorrelationIdSchema.optional(),
    metadata: SafeAuditTimelineCursorMetadataSchema.optional(),
  })
  .strict();

export type AuditTimelineCursor = z.infer<typeof AuditTimelineCursorSchema>;
export type AuditTimelineCursorInput = z.input<
  typeof AuditTimelineCursorSchema
>;
