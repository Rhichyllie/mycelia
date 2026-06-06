import { z } from "zod";
import {
  GraphSnapshotDocumentSchema,
  ImmutableSnapshotStateSchema,
  materializeGraphSnapshot,
} from "@/src/domain";

export const SnapshotVersionOriginSchema = z.enum(["manual"]);

export const SnapshotVersionStoragePayloadSchema = ImmutableSnapshotStateSchema;

const EditorSnapshotVersionBaseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  document: GraphSnapshotDocumentSchema,
  capturedViewport: SnapshotVersionStoragePayloadSchema.shape.capturedViewport,
  label: z.string().trim().min(1).max(200).optional(),
  origin: SnapshotVersionOriginSchema,
  createdAt: z.date(),
}).strict();

export const EditorSnapshotVersionSchema = EditorSnapshotVersionBaseSchema.transform(
  (value) => ({
    ...value,
    snapshot: materializeGraphSnapshot({
      document: value.document,
      viewport: value.capturedViewport,
    }),
  }),
);

export function materializeEditorSnapshotVersion(
  input: z.input<typeof EditorSnapshotVersionBaseSchema>,
): EditorSnapshotVersion {
  return EditorSnapshotVersionSchema.parse(input);
}

export const EditorSnapshotVersionSummarySchema = EditorSnapshotVersionBaseSchema.omit(
  {
    document: true,
    capturedViewport: true,
  },
);

export type SnapshotVersionOrigin = z.infer<typeof SnapshotVersionOriginSchema>;
export type SnapshotVersionStoragePayload = z.infer<
  typeof SnapshotVersionStoragePayloadSchema
>;
export type EditorSnapshotVersion = z.infer<typeof EditorSnapshotVersionSchema>;
export type EditorSnapshotVersionSummary = z.infer<
  typeof EditorSnapshotVersionSummarySchema
>;
