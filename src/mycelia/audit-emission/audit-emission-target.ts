import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
} from "../shared-kernel";
import {
  AuditOpaqueReferenceSchema,
  SafeAuditMetadataSchema,
} from "../audit-record";

export const AuditEmissionTargetTypes = [
  "DESCRIPTOR_ONLY",
  "INTERNAL_AUDIT_STREAM",
  "OBSERVABILITY_PIPELINE",
  "COMPLIANCE_EXPORT",
  "INVESTIGATION_VIEW",
] as const;

export type AuditEmissionTargetType =
  (typeof AuditEmissionTargetTypes)[number];

export const AuditEmissionTargetTypeSchema = z.enum(
  AuditEmissionTargetTypes,
);

const UNSAFE_AUDIT_EMISSION_TARGET_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|broker|connection|credential|endpoint|file|filesystem|password|path|private[_-]?key|queue|raw|secret|token|transport|webhook)/i;

const AuditEmissionTargetRefSchema = AuditOpaqueReferenceSchema.refine(
  (value) => !UNSAFE_AUDIT_EMISSION_TARGET_PATTERN.test(value),
  "audit emission target reference must not expose transport details.",
);

const AuditEmissionTargetMetadataSchema = SafeAuditMetadataSchema.refine(
  (metadata) =>
    Object.entries(metadata).every(([key, value]) => {
      if (UNSAFE_AUDIT_EMISSION_TARGET_PATTERN.test(key)) {
        return false;
      }

      return (
        typeof value !== "string" ||
        !UNSAFE_AUDIT_EMISSION_TARGET_PATTERN.test(value)
      );
    }),
  "audit emission target metadata must not expose transport details.",
);

export const AuditEmissionTargetSchema = z
  .object({
    target_type: AuditEmissionTargetTypeSchema,
    tenant_id: TenantIdSchema,
    target_ref: AuditEmissionTargetRefSchema.optional(),
    data_classification: DataClassificationSchema.optional(),
    metadata: AuditEmissionTargetMetadataSchema.optional(),
  })
  .strict();

export type AuditEmissionTarget = z.infer<typeof AuditEmissionTargetSchema>;
export type AuditEmissionTargetInput = z.input<
  typeof AuditEmissionTargetSchema
>;
