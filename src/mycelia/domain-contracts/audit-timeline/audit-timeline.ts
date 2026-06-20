import { z } from "zod";

import {
  CorrelationIdSchema,
  DataClassificationSchema,
  ProjectIdSchema,
  RunIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditOpaqueReferenceSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";

import { AuditTimelineCursorSchema } from "./audit-timeline-cursor";
import { AuditTimelineEntrySchema } from "./audit-timeline-entry";

export const AuditTimelineIdSchema = AuditOpaqueReferenceSchema;

export const AuditTimelineScopeSchema = z
  .object({
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
  })
  .strict()
  .refine(
    (scope) =>
      scope.project_id === undefined || scope.workspace_id !== undefined,
    "project_id requires workspace_id.",
  );

export const AuditTimelineSchema = z
  .object({
    audit_timeline_id: AuditTimelineIdSchema,
    tenant_id: TenantIdSchema,
    scope: AuditTimelineScopeSchema,
    entries: z
      .array(AuditTimelineEntrySchema)
      .min(1, "entries must be non-empty."),
    created_at: z.string().refine(
      isAuditIsoDateTime,
      "created_at must be an ISO datetime string.",
    ),
    data_classification: DataClassificationSchema,
    cursor: AuditTimelineCursorSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((timeline, context) => {
    for (const [index, entry] of timeline.entries.entries()) {
      if (entry.tenant_id !== timeline.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "timeline entry tenant_id must match timeline tenant_id.",
          path: ["entries", index, "tenant_id"],
        });
      }
    }

    for (let index = 1; index < timeline.entries.length; index += 1) {
      const previous = timeline.entries[index - 1];
      const current = timeline.entries[index];

      if (current.sequence_number <= previous.sequence_number) {
        context.addIssue({
          code: "custom",
          message:
            "timeline entries must be strictly ordered by sequence_number.",
          path: ["entries", index, "sequence_number"],
        });
      }
    }

    if (
      timeline.cursor !== undefined &&
      timeline.cursor.tenant_id !== timeline.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "cursor tenant_id must match timeline tenant_id.",
        path: ["cursor", "tenant_id"],
      });
    }

    if (
      timeline.cursor !== undefined &&
      timeline.cursor.timeline_id !== timeline.audit_timeline_id
    ) {
      context.addIssue({
        code: "custom",
        message: "cursor timeline_id must match audit_timeline_id.",
        path: ["cursor", "timeline_id"],
      });
    }
  });

export type AuditTimelineScope = z.infer<typeof AuditTimelineScopeSchema>;
export type AuditTimeline = z.infer<typeof AuditTimelineSchema>;
export type AuditTimelineInput = z.input<typeof AuditTimelineSchema>;
