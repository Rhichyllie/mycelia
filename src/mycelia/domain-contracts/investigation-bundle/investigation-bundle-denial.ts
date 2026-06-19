import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";

export const InvestigationBundleDenialCodes = [
  "INVESTIGATION_BUNDLE_REQUIRED",
  "INVESTIGATION_BUNDLE_INVALID",
  "INVESTIGATION_BUNDLE_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "INVESTIGATION_BUNDLE_SCOPE_REQUIRED",
  "INVESTIGATION_BUNDLE_SCOPE_INVALID",
  "INVESTIGATION_BUNDLE_SCOPE_TENANT_MISMATCH",
  "INVESTIGATION_BUNDLE_ITEMS_REQUIRED",
  "INVESTIGATION_BUNDLE_ITEM_REQUIRED",
  "INVESTIGATION_BUNDLE_ITEM_INVALID",
  "INVESTIGATION_BUNDLE_ITEM_KIND_INVALID",
  "INVESTIGATION_BUNDLE_ITEM_REF_INVALID",
  "INVESTIGATION_BUNDLE_ITEM_TENANT_MISMATCH",
  "INVESTIGATION_BUNDLE_ITEM_TIMESTAMP_INVALID",
  "INVESTIGATION_BUNDLE_TIMELINE_INVALID",
  "INVESTIGATION_BUNDLE_TIMELINE_TENANT_MISMATCH",
  "INVESTIGATION_BUNDLE_TIMELINE_REF_INVALID",
  "INVESTIGATION_BUNDLE_SUMMARY_REQUIRED",
  "INVESTIGATION_BUNDLE_SUMMARY_INVALID",
  "INVESTIGATION_BUNDLE_SUMMARY_TENANT_MISMATCH",
  "INVESTIGATION_BUNDLE_SUMMARY_ITEM_COUNT_MISMATCH",
  "INVESTIGATION_BUNDLE_SUMMARY_RANGE_INVALID",
  "INVALID_INVESTIGATION_BUNDLE_TIMESTAMP",
  "UNSAFE_INVESTIGATION_BUNDLE_METADATA",
  "INVESTIGATION_BUNDLE_NOT_VALID",
] as const;

export type InvestigationBundleDenialCode =
  (typeof InvestigationBundleDenialCodes)[number];

export const InvestigationBundleDenialCodeSchema = z.enum(
  InvestigationBundleDenialCodes,
);

export type InvestigationBundleDenial = {
  readonly code: InvestigationBundleDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateInvestigationBundleDenialInput = {
  readonly code: InvestigationBundleDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_INVESTIGATION_BUNDLE_DENIAL_MESSAGES: Record<
  InvestigationBundleDenialCode,
  string
> = {
  INVESTIGATION_BUNDLE_REQUIRED:
    "An investigation bundle descriptor is required.",
  INVESTIGATION_BUNDLE_INVALID:
    "The investigation bundle descriptor is invalid.",
  INVESTIGATION_BUNDLE_ID_REQUIRED:
    "An investigation bundle identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  INVESTIGATION_BUNDLE_SCOPE_REQUIRED:
    "An investigation bundle scope is required.",
  INVESTIGATION_BUNDLE_SCOPE_INVALID:
    "The investigation bundle scope is invalid.",
  INVESTIGATION_BUNDLE_SCOPE_TENANT_MISMATCH:
    "The investigation bundle scope is invalid.",
  INVESTIGATION_BUNDLE_ITEMS_REQUIRED:
    "Investigation bundle items are required.",
  INVESTIGATION_BUNDLE_ITEM_REQUIRED:
    "An investigation bundle item descriptor is required.",
  INVESTIGATION_BUNDLE_ITEM_INVALID:
    "The investigation bundle item descriptor is invalid.",
  INVESTIGATION_BUNDLE_ITEM_KIND_INVALID:
    "The investigation bundle item kind is invalid.",
  INVESTIGATION_BUNDLE_ITEM_REF_INVALID:
    "The investigation bundle item reference is invalid.",
  INVESTIGATION_BUNDLE_ITEM_TENANT_MISMATCH:
    "The investigation bundle item scope is invalid.",
  INVESTIGATION_BUNDLE_ITEM_TIMESTAMP_INVALID:
    "The investigation bundle item timestamp is invalid.",
  INVESTIGATION_BUNDLE_TIMELINE_INVALID:
    "The investigation bundle timeline descriptor is invalid.",
  INVESTIGATION_BUNDLE_TIMELINE_TENANT_MISMATCH:
    "The investigation bundle timeline scope is invalid.",
  INVESTIGATION_BUNDLE_TIMELINE_REF_INVALID:
    "The investigation bundle timeline reference is invalid.",
  INVESTIGATION_BUNDLE_SUMMARY_REQUIRED:
    "An investigation bundle summary is required.",
  INVESTIGATION_BUNDLE_SUMMARY_INVALID:
    "The investigation bundle summary is invalid.",
  INVESTIGATION_BUNDLE_SUMMARY_TENANT_MISMATCH:
    "The investigation bundle summary scope is invalid.",
  INVESTIGATION_BUNDLE_SUMMARY_ITEM_COUNT_MISMATCH:
    "The investigation bundle summary count is invalid.",
  INVESTIGATION_BUNDLE_SUMMARY_RANGE_INVALID:
    "The investigation bundle summary range is invalid.",
  INVALID_INVESTIGATION_BUNDLE_TIMESTAMP:
    "The investigation bundle timestamp is invalid.",
  UNSAFE_INVESTIGATION_BUNDLE_METADATA:
    "The investigation bundle metadata is unsafe.",
  INVESTIGATION_BUNDLE_NOT_VALID:
    "The investigation bundle descriptor is not valid.",
};

export const InvestigationBundleDenialSchema = z
  .object({
    code: InvestigationBundleDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createInvestigationBundleDenial(
  input: CreateInvestigationBundleDenialInput,
): InvestigationBundleDenial {
  return {
    code: input.code,
    message: SAFE_INVESTIGATION_BUNDLE_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
