import {
  err,
  ok,
  type Result,
} from "../shared-kernel";
import { type CorrelationId } from "../shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../audit-record";
import { validateAuditTimeline } from "../audit-timeline";

import {
  InvestigationBundleSchema,
  type InvestigationBundle,
} from "./investigation-bundle";
import {
  createInvestigationBundleDenial,
  type InvestigationBundleDenial,
} from "./investigation-bundle-denial";
import {
  InvestigationBundleItemKindSchema,
  InvestigationBundleItemSchema,
  InvestigationBundleReferenceSchema,
  type InvestigationBundleItem,
} from "./investigation-bundle-item";
import {
  InvestigationBundleScopeSchema,
  type InvestigationBundleScope,
} from "./investigation-bundle-scope";
import {
  InvestigationBundleSummarySchema,
  type InvestigationBundleSummary,
} from "./investigation-bundle-summary";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

function doesSummaryRangeCoverItems(
  summary: InvestigationBundleSummary,
  items: readonly InvestigationBundleItem[],
): boolean {
  if (items.length === 0) {
    return summary.item_count === 0;
  }

  const observedTimes = items.map((item) => Date.parse(item.observed_at));
  const earliestObserved = Math.min(...observedTimes);
  const latestObserved = Math.max(...observedTimes);

  return (
    Date.parse(summary.earliest_observed_at) <= earliestObserved &&
    Date.parse(summary.latest_observed_at) >= latestObserved
  );
}

export function validateInvestigationBundleScope(
  input: unknown,
): Result<InvestigationBundleScope, InvestigationBundleDenial> {
  if (!isRecord(input)) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SCOPE_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createInvestigationBundleDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  const parsed = InvestigationBundleScopeSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SCOPE_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateInvestigationBundleItem(
  input: unknown,
): Result<InvestigationBundleItem, InvestigationBundleDenial> {
  if (!isRecord(input)) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_ITEM_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createInvestigationBundleDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  if (!InvestigationBundleItemKindSchema.safeParse(input.item_kind).success) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_ITEM_KIND_INVALID",
      }),
    );
  }

  if (!InvestigationBundleReferenceSchema.safeParse(input.item_ref).success) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_ITEM_REF_INVALID",
      }),
    );
  }

  if (
    typeof input.observed_at !== "string" ||
    !isAuditIsoDateTime(input.observed_at)
  ) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_ITEM_TIMESTAMP_INVALID",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createInvestigationBundleDenial({
        code: "UNSAFE_INVESTIGATION_BUNDLE_METADATA",
      }),
    );
  }

  const parsed = InvestigationBundleItemSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_ITEM_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateInvestigationBundleSummary(
  input: unknown,
): Result<InvestigationBundleSummary, InvestigationBundleDenial> {
  if (!isRecord(input)) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createInvestigationBundleDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  if (
    !Number.isInteger(input.item_count) ||
    typeof input.item_count !== "number" ||
    input.item_count < 0
  ) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_INVALID",
      }),
    );
  }

  if (
    typeof input.earliest_observed_at !== "string" ||
    typeof input.latest_observed_at !== "string" ||
    typeof input.generated_at !== "string" ||
    !isAuditIsoDateTime(input.earliest_observed_at) ||
    !isAuditIsoDateTime(input.latest_observed_at) ||
    !isAuditIsoDateTime(input.generated_at)
  ) {
    return err(
      createInvestigationBundleDenial({
        code: "INVALID_INVESTIGATION_BUNDLE_TIMESTAMP",
      }),
    );
  }

  if (
    Date.parse(input.latest_observed_at) <
    Date.parse(input.earliest_observed_at)
  ) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_RANGE_INVALID",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createInvestigationBundleDenial({
        code: "UNSAFE_INVESTIGATION_BUNDLE_METADATA",
      }),
    );
  }

  const parsed = InvestigationBundleSummarySchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateInvestigationBundle(
  input: unknown,
): Result<InvestigationBundle, InvestigationBundleDenial> {
  if (!isRecord(input)) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_REQUIRED",
      }),
    );
  }

  if (input.investigation_bundle_id === undefined) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createInvestigationBundleDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  const scope = validateInvestigationBundleScope(input.scope);

  if (!scope.ok) {
    return err(scope.error);
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_ITEMS_REQUIRED",
      }),
    );
  }

  const parsedItems: InvestigationBundleItem[] = [];

  for (const item of input.items) {
    const parsedItem = validateInvestigationBundleItem(item);

    if (!parsedItem.ok) {
      return err(parsedItem.error);
    }

    parsedItems.push(parsedItem.value);
  }

  if (input.audit_timeline !== undefined) {
    const timeline = validateAuditTimeline(input.audit_timeline);

    if (!timeline.ok) {
      return err(
        createInvestigationBundleDenial({
          code: "INVESTIGATION_BUNDLE_TIMELINE_INVALID",
        }),
      );
    }
  }

  if (
    input.audit_timeline_ref !== undefined &&
    !InvestigationBundleReferenceSchema.safeParse(
      input.audit_timeline_ref,
    ).success
  ) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_TIMELINE_REF_INVALID",
      }),
    );
  }

  const summary = validateInvestigationBundleSummary(input.summary);

  if (!summary.ok) {
    return err(summary.error);
  }

  if (
    typeof input.created_at !== "string" ||
    !isAuditIsoDateTime(input.created_at)
  ) {
    return err(
      createInvestigationBundleDenial({
        code: "INVALID_INVESTIGATION_BUNDLE_TIMESTAMP",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createInvestigationBundleDenial({
        code: "UNSAFE_INVESTIGATION_BUNDLE_METADATA",
      }),
    );
  }

  if (summary.value.item_count !== parsedItems.length) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_ITEM_COUNT_MISMATCH",
      }),
    );
  }

  if (!doesSummaryRangeCoverItems(summary.value, parsedItems)) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_RANGE_INVALID",
      }),
    );
  }

  const parsed = InvestigationBundleSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("scope.tenant_id")) {
      return err(
        createInvestigationBundleDenial({
          code: "INVESTIGATION_BUNDLE_SCOPE_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("items")) {
      return err(
        createInvestigationBundleDenial({
          code: "INVESTIGATION_BUNDLE_ITEM_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("audit_timeline")) {
      return err(
        createInvestigationBundleDenial({
          code: "INVESTIGATION_BUNDLE_TIMELINE_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("summary.tenant_id")) {
      return err(
        createInvestigationBundleDenial({
          code: "INVESTIGATION_BUNDLE_SUMMARY_TENANT_MISMATCH",
        }),
      );
    }

    if (
      issuePath?.startsWith("summary.item_count") ||
      issuePath?.startsWith("summary.earliest_observed_at") ||
      issuePath?.startsWith("summary.latest_observed_at")
    ) {
      return err(
        createInvestigationBundleDenial({
          code: "INVESTIGATION_BUNDLE_SUMMARY_RANGE_INVALID",
        }),
      );
    }

    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function ensureInvestigationBundleItemsMatchTenant(
  bundle: InvestigationBundle,
): Result<true, InvestigationBundleDenial> {
  const itemsMatchTenant = bundle.items.every(
    (item) => item.tenant_id === bundle.tenant_id,
  );

  if (!itemsMatchTenant) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_ITEM_TENANT_MISMATCH",
        correlation_id: bundle.scope.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureInvestigationBundleTimelineMatchesTenant(
  bundle: InvestigationBundle,
): Result<true, InvestigationBundleDenial> {
  if (bundle.audit_timeline === undefined) {
    return ok(true);
  }

  if (bundle.audit_timeline.tenant_id !== bundle.tenant_id) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_TIMELINE_TENANT_MISMATCH",
        correlation_id: bundle.scope.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureInvestigationBundleSummaryMatchesItems(
  bundle: InvestigationBundle,
): Result<true, InvestigationBundleDenial> {
  if (bundle.summary.tenant_id !== bundle.tenant_id) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_TENANT_MISMATCH",
        correlation_id: bundle.scope.correlation_id,
      }),
    );
  }

  if (bundle.summary.item_count !== bundle.items.length) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_ITEM_COUNT_MISMATCH",
        correlation_id: bundle.scope.correlation_id,
      }),
    );
  }

  if (!doesSummaryRangeCoverItems(bundle.summary, bundle.items)) {
    return err(
      createInvestigationBundleDenial({
        code: "INVESTIGATION_BUNDLE_SUMMARY_RANGE_INVALID",
        correlation_id: bundle.scope.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertInvestigationBundleValid(
  input: unknown,
): Result<InvestigationBundle, InvestigationBundleDenial> {
  return validateInvestigationBundle(input);
}

export function failClosedInvestigationBundle(
  correlation_id?: CorrelationId,
): InvestigationBundleDenial {
  return createInvestigationBundleDenial({
    code: "INVESTIGATION_BUNDLE_NOT_VALID",
    correlation_id,
  });
}
