import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  TenantIdSchema,
} from "../shared-kernel";
import {
  AuditOpaqueReferenceSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../audit-record";

export const InvestigationBundleItemKinds = [
  "AUDIT_TIMELINE",
  "AUDIT_RECORD",
  "AUDIT_EMISSION",
  "RUNTIME_STATE",
  "STATE_TRANSITION",
  "STATE_TRANSITION_COORDINATION",
  "GOVERNED_RUN",
  "EVENT_REFERENCE",
  "POLICY_DECISION_REFERENCE",
  "SYSTEM_VALIDATION_REFERENCE",
] as const;

export type InvestigationBundleItemKind =
  (typeof InvestigationBundleItemKinds)[number];

export const InvestigationBundleItemKindSchema = z.enum(
  InvestigationBundleItemKinds,
);

const UNSAFE_INVESTIGATION_ITEM_REF_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection|credential|database|endpoint|password|path|private[_-]?key|query|raw|secret|select\s|insert\s|update\s|delete\s|drop\s|shell|sql|token|\s)/i;

export const InvestigationBundleReferenceSchema =
  AuditOpaqueReferenceSchema.refine(
    (value) => !UNSAFE_INVESTIGATION_ITEM_REF_PATTERN.test(value),
    "investigation reference must be opaque and safe.",
  );

export const InvestigationBundleItemIdSchema =
  InvestigationBundleReferenceSchema;

export const InvestigationBundleItemSchema = z
  .object({
    investigation_bundle_item_id: InvestigationBundleItemIdSchema,
    tenant_id: TenantIdSchema,
    item_kind: InvestigationBundleItemKindSchema,
    item_ref: InvestigationBundleReferenceSchema,
    data_classification: DataClassificationSchema,
    observed_at: z.string().refine(
      isAuditIsoDateTime,
      "observed_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict();

export type InvestigationBundleItem = z.infer<
  typeof InvestigationBundleItemSchema
>;
export type InvestigationBundleItemInput = z.input<
  typeof InvestigationBundleItemSchema
>;
