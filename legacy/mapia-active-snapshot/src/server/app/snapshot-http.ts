import { z } from "zod";
import {
  GraphSnapshotBoundarySchema,
  GraphSnapshotDocumentBoundarySchema,
  ViewportStateSchema,
} from "@/src/domain";
import type { WorkingSnapshotRecord } from "@/src/modules/graph/application";
import type {
  EditorSnapshotVersion,
  EditorSnapshotVersionSummary,
  GraphSnapshotDiff,
} from "@/src/modules/versioning/domain";
import {
  GraphSnapshotDiffSchema,
  SnapshotVersionOriginSchema,
} from "@/src/modules/versioning/domain";

export const SNAPSHOT_WIRE_COMPATIBILITY_HEADER =
  "x-mapia-wire-compatibility" as const;
export const MATERIALIZED_SNAPSHOT_COMPATIBILITY_MODE =
  "materialized-snapshot" as const;

const IsoDateTimeSchema = z.string().datetime();

export const WorkingSnapshotHttpSchema = z
  .object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    storageSlot: z.literal(1),
    versionNumber: z.literal(1),
    revision: z.number().int().positive(),
    label: z.string().trim().min(1).max(200).optional(),
    document: GraphSnapshotDocumentBoundarySchema,
    viewport: ViewportStateSchema,
    createdByIdentity: z.string().trim().min(1).max(255).optional(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const WorkingSnapshotCompatibilityHttpSchema = WorkingSnapshotHttpSchema.extend({
  snapshot: GraphSnapshotBoundarySchema,
}).strict();

export const SnapshotVersionSummaryHttpSchema = z
  .object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    label: z.string().trim().min(1).max(200).optional(),
    origin: SnapshotVersionOriginSchema,
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const SnapshotVersionDetailHttpSchema = SnapshotVersionSummaryHttpSchema.extend({
  document: GraphSnapshotDocumentBoundarySchema,
  capturedViewport: ViewportStateSchema,
}).strict();

export const GraphSnapshotDiffHttpSchema = GraphSnapshotDiffSchema;

function toIsoDate(value: Date) {
  return value.toISOString();
}

export function serializeWorkingSnapshotForHttp(
  input: WorkingSnapshotRecord,
) {
  return WorkingSnapshotHttpSchema.parse({
    id: input.id,
    projectId: input.projectId,
    storageSlot: input.storageSlot,
    versionNumber: input.versionNumber,
    revision: input.revision,
    label: input.label,
    document: input.document,
    viewport: input.viewport,
    createdByIdentity: input.createdByIdentity,
    createdAt: toIsoDate(input.createdAt),
  });
}

export function serializeCompatibilityWorkingSnapshotForHttp(
  input: WorkingSnapshotRecord,
) {
  return WorkingSnapshotCompatibilityHttpSchema.parse({
    ...serializeWorkingSnapshotForHttp(input),
    snapshot: input.snapshot,
  });
}

export function serializeSnapshotVersionSummaryForHttp(
  input: EditorSnapshotVersionSummary,
) {
  return SnapshotVersionSummaryHttpSchema.parse({
    id: input.id,
    projectId: input.projectId,
    label: input.label,
    origin: input.origin,
    createdAt: toIsoDate(input.createdAt),
  });
}

export function serializeSnapshotVersionDetailForHttp(
  input: EditorSnapshotVersion,
) {
  return SnapshotVersionDetailHttpSchema.parse({
    ...serializeSnapshotVersionSummaryForHttp(input),
    document: input.document,
    capturedViewport: input.capturedViewport,
  });
}

export function serializeSnapshotVersionListForHttp(
  input: EditorSnapshotVersionSummary[],
) {
  return input.map((item) => serializeSnapshotVersionSummaryForHttp(item));
}

export function serializeSnapshotDiffForHttp(input: GraphSnapshotDiff) {
  return GraphSnapshotDiffHttpSchema.parse(input);
}

export function buildSnapshotCompatibilityHeaders(
  compatibility: typeof MATERIALIZED_SNAPSHOT_COMPATIBILITY_MODE,
) {
  return {
    [SNAPSHOT_WIRE_COMPATIBILITY_HEADER]: compatibility,
  } as const;
}
