import { z } from "zod";
import { GraphSnapshotBoundarySchema } from "@/src/domain";

export const LoadWorkingSnapshotInputSchema = z.object({
  projectId: z.string().uuid(),
});

export const SaveWorkingSnapshotInputSchema = z.object({
  projectId: z.string().uuid(),
  actorIdentity: z.string().email().optional(),
  label: z.string().trim().min(1).max(200).optional(),
  expectedRevision: z.number().int().nonnegative().optional(),
  snapshot: GraphSnapshotBoundarySchema,
}).strict();

export type LoadWorkingSnapshotInput = z.infer<
  typeof LoadWorkingSnapshotInputSchema
>;
export type SaveWorkingSnapshotInput = z.infer<
  typeof SaveWorkingSnapshotInputSchema
>;
