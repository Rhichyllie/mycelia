import { z } from "zod";
import {
  GraphSnapshotDocumentSchema,
  ViewportStateSchema,
  materializeGraphSnapshot,
} from "@/src/domain";

const WorkingSnapshotStorageSlotSchema = z.literal(1);

const WorkingSnapshotStateBaseSchema = z
  .object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    storageSlot: WorkingSnapshotStorageSlotSchema,
    versionNumber: WorkingSnapshotStorageSlotSchema,
    revision: z.number().int().positive(),
    label: z.string().trim().min(1).max(200).optional(),
    document: GraphSnapshotDocumentSchema,
    viewport: ViewportStateSchema,
    createdByIdentity: z.string().trim().min(1).max(255).optional(),
    createdAt: z.date(),
  })
  .strict();

export const WorkingSnapshotStateSchema = WorkingSnapshotStateBaseSchema.transform(
  (value) => ({
    ...value,
    snapshot: materializeGraphSnapshot({
      document: value.document,
      viewport: value.viewport,
    }),
  }),
);

export function materializeWorkingSnapshotState(
  input: z.input<typeof WorkingSnapshotStateBaseSchema>,
): WorkingSnapshotState {
  return WorkingSnapshotStateSchema.parse(input);
}

export type WorkingSnapshotState = z.infer<typeof WorkingSnapshotStateSchema>;
