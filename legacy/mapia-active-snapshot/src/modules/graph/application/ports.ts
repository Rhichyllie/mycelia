import { z } from "zod";
import type {
  GraphSnapshot,
  GraphSnapshotDocument,
  ViewportState,
} from "@/src/domain";
import { GraphSnapshotBoundarySchema } from "@/src/domain";

export const WORKING_SNAPSHOT_STORAGE_SLOT = 1 as const;

export type WorkingSnapshotRecord = {
  id: string;
  projectId: string;
  storageSlot: number;
  versionNumber: number;
  revision: number;
  label?: string;
  document: GraphSnapshotDocument;
  viewport: ViewportState;
  snapshot: GraphSnapshot;
  createdByIdentity?: string;
  createdAt: Date;
};

export type SaveWorkingSnapshotRecordInput = {
  projectId: string;
  snapshot: GraphSnapshot;
  actorIdentity?: string;
  label?: string;
  expectedRevision?: number;
};

export const SaveWorkingSnapshotRecordInputSchema = z
  .object({
    projectId: z.string().uuid(),
    snapshot: GraphSnapshotBoundarySchema,
    actorIdentity: z.string().trim().min(1).max(255).optional(),
    label: z.string().trim().min(1).max(200).optional(),
    expectedRevision: z.number().int().nonnegative().optional(),
  })
  .strict();

export interface WorkingSnapshotRepository {
  load(projectId: string): Promise<WorkingSnapshotRecord | null>;
  save(input: SaveWorkingSnapshotRecordInput): Promise<WorkingSnapshotRecord>;
}
