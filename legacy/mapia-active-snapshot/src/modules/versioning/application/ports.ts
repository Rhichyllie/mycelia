import { z } from "zod";
import type { GraphSnapshotDocument, ViewportState } from "@/src/domain";
import {
  GraphSnapshotDocumentBoundarySchema,
  ViewportStateSchema,
} from "@/src/domain";
import type {
  EditorSnapshotVersion,
  EditorSnapshotVersionSummary,
  SnapshotVersionOrigin,
} from "@/src/modules/versioning/domain";
import { SnapshotVersionOriginSchema } from "@/src/modules/versioning/domain";

export type CreateSnapshotVersionRecordInput = {
  projectId: string;
  document: GraphSnapshotDocument;
  capturedViewport: ViewportState;
  label?: string;
  origin?: SnapshotVersionOrigin;
};

export const CreateSnapshotVersionRecordInputSchema = z
  .object({
    projectId: z.string().uuid(),
    document: GraphSnapshotDocumentBoundarySchema,
    capturedViewport: ViewportStateSchema,
    label: z.string().trim().min(1).max(200).optional(),
    origin: SnapshotVersionOriginSchema.optional(),
  })
  .strict();

export interface SnapshotVersionRepository {
  create(input: CreateSnapshotVersionRecordInput): Promise<EditorSnapshotVersion>;
  listByProject(projectId: string): Promise<EditorSnapshotVersionSummary[]>;
  getById(
    projectId: string,
    versionId: string,
  ): Promise<EditorSnapshotVersion | null>;
}
