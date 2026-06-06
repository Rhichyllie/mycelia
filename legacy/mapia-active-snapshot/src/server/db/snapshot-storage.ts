import type { PrismaClient } from "@prisma/client";

// The physical Prisma delegates still map to inherited tables. Keep those names
// confined to this storage boundary so upper layers can speak only in working
// snapshot / immutable snapshot version semantics.
export const WORKING_SNAPSHOT_STORAGE_TABLE = "graph_versions" as const;
export const SNAPSHOT_VERSION_STORAGE_TABLE =
  "editor_snapshot_versions" as const;

export type WorkingSnapshotStorageDelegate = PrismaClient["graphVersion"];
export type SnapshotVersionStorageDelegate =
  PrismaClient["editorSnapshotVersion"];

export function getWorkingSnapshotStorageDelegate(prisma: PrismaClient) {
  return prisma.graphVersion;
}

export function getSnapshotVersionStorageDelegate(prisma: PrismaClient) {
  return prisma.editorSnapshotVersion;
}
