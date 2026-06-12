import {
  err,
  ok,
  type Result,
} from "../shared-kernel";
import { type CorrelationId } from "../shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
  validateAuditRecord,
} from "../audit-record";
import { validateAuditEmissionResult } from "../audit-emission";

import {
  createAuditTimelineDenial,
  type AuditTimelineDenial,
} from "./audit-timeline-denial";
import {
  AuditTimelineCursorSchema,
  type AuditTimelineCursor,
} from "./audit-timeline-cursor";
import {
  AuditTimelineEntryKindSchema,
  AuditTimelineEntrySchema,
  type AuditTimelineEntry,
} from "./audit-timeline-entry";
import {
  AuditTimelineSchema,
  type AuditTimeline,
} from "./audit-timeline";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

export function validateAuditTimelineEntry(
  input: unknown,
): Result<AuditTimelineEntry, AuditTimelineDenial> {
  if (!isRecord(input)) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_ENTRY_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createAuditTimelineDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (!AuditTimelineEntryKindSchema.safeParse(input.entry_kind).success) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_ENTRY_KIND_INVALID",
      }),
    );
  }

  if (
    typeof input.occurred_at !== "string" ||
    !isAuditIsoDateTime(input.occurred_at)
  ) {
    return err(
      createAuditTimelineDenial({
        code: "INVALID_AUDIT_TIMELINE_TIMESTAMP",
      }),
    );
  }

  if (
    !Number.isInteger(input.sequence_number) ||
    typeof input.sequence_number !== "number" ||
    input.sequence_number <= 0
  ) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_ENTRY_SEQUENCE_INVALID",
      }),
    );
  }

  if (input.audit_record !== undefined) {
    const auditRecord = validateAuditRecord(input.audit_record);

    if (!auditRecord.ok) {
      return err(
        createAuditTimelineDenial({
          code: "AUDIT_TIMELINE_AUDIT_RECORD_INVALID",
        }),
      );
    }
  }

  if (input.audit_emission_result !== undefined) {
    const auditEmissionResult = validateAuditEmissionResult(
      input.audit_emission_result,
    );

    if (!auditEmissionResult.ok) {
      return err(
        createAuditTimelineDenial({
          code: "AUDIT_TIMELINE_AUDIT_EMISSION_RESULT_INVALID",
        }),
      );
    }
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createAuditTimelineDenial({
        code: "UNSAFE_AUDIT_TIMELINE_METADATA",
      }),
    );
  }

  const parsed = AuditTimelineEntrySchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("audit_record")) {
      return err(
        createAuditTimelineDenial({
          code: "AUDIT_TIMELINE_AUDIT_RECORD_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("audit_emission_result")) {
      return err(
        createAuditTimelineDenial({
          code: "AUDIT_TIMELINE_AUDIT_EMISSION_RESULT_TENANT_MISMATCH",
        }),
      );
    }

    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_ENTRY_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateAuditTimelineCursor(
  input: unknown,
): Result<AuditTimelineCursor, AuditTimelineDenial> {
  if (!isRecord(input)) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_CURSOR_REQUIRED",
      }),
    );
  }

  if (
    input.metadata !== undefined &&
    !AuditTimelineCursorSchema.safeParse(input).success
  ) {
    const metadataOnly = AuditTimelineCursorSchema.safeParse({
      ...input,
      metadata: undefined,
    });

    if (metadataOnly.success) {
      return err(
        createAuditTimelineDenial({
          code: "UNSAFE_AUDIT_TIMELINE_METADATA",
        }),
      );
    }
  }

  const parsed = AuditTimelineCursorSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_CURSOR_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function isAuditTimelineOrdered(
  entries: readonly Pick<AuditTimelineEntry, "sequence_number">[],
): boolean {
  for (let index = 1; index < entries.length; index += 1) {
    if (entries[index].sequence_number <= entries[index - 1].sequence_number) {
      return false;
    }
  }

  return true;
}

export function validateAuditTimeline(
  input: unknown,
): Result<AuditTimeline, AuditTimelineDenial> {
  if (!isRecord(input)) {
    return err(
      createAuditTimelineDenial({ code: "AUDIT_TIMELINE_REQUIRED" }),
    );
  }

  if (input.audit_timeline_id === undefined) {
    return err(
      createAuditTimelineDenial({ code: "AUDIT_TIMELINE_ID_REQUIRED" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createAuditTimelineDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (
    isRecord(input.scope) &&
    input.scope.project_id !== undefined &&
    input.scope.workspace_id === undefined
  ) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_SCOPE_INVALID",
      }),
    );
  }

  if (!Array.isArray(input.entries) || input.entries.length === 0) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_ENTRIES_REQUIRED",
      }),
    );
  }

  for (const entry of input.entries) {
    const entryResult = validateAuditTimelineEntry(entry);

    if (!entryResult.ok) {
      return err(entryResult.error);
    }
  }

  if (
    !isAuditTimelineOrdered(
      input.entries as readonly Pick<AuditTimelineEntry, "sequence_number">[],
    )
  ) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_ENTRY_ORDER_INVALID",
      }),
    );
  }

  if (
    typeof input.created_at !== "string" ||
    !isAuditIsoDateTime(input.created_at)
  ) {
    return err(
      createAuditTimelineDenial({
        code: "INVALID_AUDIT_TIMELINE_TIMESTAMP",
      }),
    );
  }

  if (input.cursor !== undefined) {
    const cursor = validateAuditTimelineCursor(input.cursor);

    if (!cursor.ok) {
      return cursor;
    }
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createAuditTimelineDenial({
        code: "UNSAFE_AUDIT_TIMELINE_METADATA",
      }),
    );
  }

  const parsed = AuditTimelineSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("entries")) {
      return err(
        createAuditTimelineDenial({
          code: "AUDIT_TIMELINE_ENTRY_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("cursor.tenant_id")) {
      return err(
        createAuditTimelineDenial({
          code: "AUDIT_TIMELINE_CURSOR_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("cursor.timeline_id")) {
      return err(
        createAuditTimelineDenial({
          code: "AUDIT_TIMELINE_CURSOR_TIMELINE_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("scope")) {
      return err(
        createAuditTimelineDenial({
          code: "AUDIT_TIMELINE_SCOPE_INVALID",
        }),
      );
    }

    return err(
      createAuditTimelineDenial({ code: "AUDIT_TIMELINE_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function ensureAuditTimelineEntriesMatchTenant(
  timeline: AuditTimeline,
): Result<true, AuditTimelineDenial> {
  const entriesMatchTenant = timeline.entries.every(
    (entry) => entry.tenant_id === timeline.tenant_id,
  );

  if (!entriesMatchTenant) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_ENTRY_TENANT_MISMATCH",
        correlation_id: timeline.scope.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureAuditTimelineCursorMatchesTimeline(
  timeline: AuditTimeline,
): Result<true, AuditTimelineDenial> {
  if (timeline.cursor === undefined) {
    return ok(true);
  }

  if (timeline.cursor.tenant_id !== timeline.tenant_id) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_CURSOR_TENANT_MISMATCH",
        correlation_id: timeline.cursor.correlation_id,
      }),
    );
  }

  if (timeline.cursor.timeline_id !== timeline.audit_timeline_id) {
    return err(
      createAuditTimelineDenial({
        code: "AUDIT_TIMELINE_CURSOR_TIMELINE_MISMATCH",
        correlation_id: timeline.cursor.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertAuditTimelineValid(
  input: unknown,
): Result<AuditTimeline, AuditTimelineDenial> {
  return validateAuditTimeline(input);
}

export function failClosedAuditTimeline(
  correlation_id?: CorrelationId,
): AuditTimelineDenial {
  return createAuditTimelineDenial({
    code: "AUDIT_TIMELINE_NOT_VALID",
    correlation_id,
  });
}
