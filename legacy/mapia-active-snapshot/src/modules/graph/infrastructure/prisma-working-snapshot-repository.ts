import type { Prisma } from "@prisma/client";
import { AppError } from "@/src/lib/app-error";
import type { WorkingSnapshotStorageDelegate } from "@/src/server/db/snapshot-storage";
import {
  parseStoredWorkingSnapshotState,
  splitGraphSnapshot,
} from "@/src/domain";
import { validateGraphSnapshotInvariants } from "@/src/modules/graph/domain";
import { materializeWorkingSnapshotState } from "@/src/modules/versioning/domain";
import type {
  SaveWorkingSnapshotRecordInput,
  WorkingSnapshotRecord,
  WorkingSnapshotRepository,
} from "@/src/modules/graph/application";
import {
  SaveWorkingSnapshotRecordInputSchema,
  WORKING_SNAPSHOT_STORAGE_SLOT,
} from "@/src/modules/graph/application";

type WorkingSnapshotStorageRow =
  Awaited<ReturnType<WorkingSnapshotStorageDelegate["findUnique"]>> extends infer T
    ? T
    : never;

function readRevisionValue(row: { revision?: unknown }) {
  return typeof row.revision === "number" ? row.revision : 1;
}

function invalidWorkingSnapshotStorageError(input: {
  projectId: string;
  versionNumber: number;
}) {
  return new AppError("Storage do snapshot de trabalho esta invalido.", {
    code: "WORKING_SNAPSHOT_STORAGE_INVALID",
    status: 500,
    details: {
      projectId: input.projectId,
      versionNumber: input.versionNumber,
    },
  });
}

function parseWorkingSnapshotStorageRow(
  row: NonNullable<WorkingSnapshotStorageRow>,
): WorkingSnapshotRecord {
  try {
    const normalizedRow = { ...row, revision: readRevisionValue(row) };
    const normalizedSnapshotState = parseStoredWorkingSnapshotState({
      snapshot: row.snapshot,
      viewport: row.viewport,
    });
    const snapshot = validateGraphSnapshotInvariants(
      normalizedSnapshotState.snapshot,
    );
    const validatedState = splitGraphSnapshot(snapshot);

    return materializeWorkingSnapshotState({
      id: normalizedRow.id,
      projectId: normalizedRow.projectId,
      storageSlot: WORKING_SNAPSHOT_STORAGE_SLOT,
      versionNumber: WORKING_SNAPSHOT_STORAGE_SLOT,
      revision: normalizedRow.revision,
      label: normalizedRow.label ?? undefined,
      document: validatedState.document,
      viewport: validatedState.viewport,
      createdByIdentity: normalizedRow.createdByIdentity ?? undefined,
      createdAt: normalizedRow.createdAt,
    });
  } catch {
    throw invalidWorkingSnapshotStorageError({
      projectId: row.projectId,
      versionNumber: row.versionNumber,
    });
  }
}

export class PrismaWorkingSnapshotRepository implements WorkingSnapshotRepository {
  constructor(private readonly delegate: WorkingSnapshotStorageDelegate) {}

  async load(projectId: string): Promise<WorkingSnapshotRecord | null> {
    const row = await this.delegate.findUnique({
      where: {
        projectId_versionNumber: {
          projectId,
          versionNumber: WORKING_SNAPSHOT_STORAGE_SLOT,
        },
      },
    });

    return row ? parseWorkingSnapshotStorageRow(row) : null;
  }

  async save(
    input: SaveWorkingSnapshotRecordInput,
  ): Promise<WorkingSnapshotRecord> {
    const parsedInput = SaveWorkingSnapshotRecordInputSchema.parse(input);
    const snapshot = validateGraphSnapshotInvariants(
      parsedInput.snapshot,
    );
    const { document, viewport } = splitGraphSnapshot(snapshot);
    const row = await this.delegate.findUnique({
      where: {
        projectId_versionNumber: {
          projectId: parsedInput.projectId,
          versionNumber: WORKING_SNAPSHOT_STORAGE_SLOT,
        },
      },
    });

    if (!row) {
      if (
        parsedInput.expectedRevision !== undefined &&
        parsedInput.expectedRevision !== 0
      ) {
        throw new AppError(
          "Conflito de revisao: snapshot atual diferente da revisao esperada.",
          {
            code: "CONFLICT",
            status: 409,
            details: {
              currentRevision: 0,
              expectedRevision: parsedInput.expectedRevision,
            },
          },
        );
      }

      const createdRow = await this.delegate.create({
        data: {
          projectId: parsedInput.projectId,
          versionNumber: WORKING_SNAPSHOT_STORAGE_SLOT,
          revision: 1,
          label: parsedInput.label ?? "working-copy",
          snapshot: document as unknown as Prisma.InputJsonObject,
          viewport: viewport as unknown as Prisma.InputJsonObject,
          createdByIdentity: parsedInput.actorIdentity,
        },
      });

      return parseWorkingSnapshotStorageRow(createdRow);
    }

    const currentRevision = readRevisionValue(row);
    const nextLabel = parsedInput.label ?? row.label ?? "working-copy";

    if (parsedInput.expectedRevision !== undefined) {
      const updated = await this.delegate.updateMany({
        where: {
          projectId: parsedInput.projectId,
          versionNumber: WORKING_SNAPSHOT_STORAGE_SLOT,
          revision: parsedInput.expectedRevision,
        },
        data: {
          label: nextLabel,
          snapshot: document as unknown as Prisma.InputJsonObject,
          viewport: viewport as unknown as Prisma.InputJsonObject,
          createdByIdentity: parsedInput.actorIdentity,
          revision: {
            increment: 1,
          },
        },
      });

      if (updated.count === 0) {
        const latest = await this.delegate.findUnique({
          where: {
            projectId_versionNumber: {
              projectId: parsedInput.projectId,
              versionNumber: WORKING_SNAPSHOT_STORAGE_SLOT,
            },
          },
        });

        const latestRevision = latest ? readRevisionValue(latest) : currentRevision;

        throw new AppError(
          "Conflito de revisao: snapshot atual diferente da revisao esperada.",
          {
            code: "CONFLICT",
            status: 409,
            details: {
              currentRevision: latestRevision,
              expectedRevision: parsedInput.expectedRevision,
            },
          },
        );
      }

      const persisted = await this.delegate.findUnique({
        where: {
          projectId_versionNumber: {
            projectId: parsedInput.projectId,
            versionNumber: WORKING_SNAPSHOT_STORAGE_SLOT,
          },
        },
      });

      if (!persisted) {
        throw new AppError("Snapshot de trabalho nao encontrado apos atualizacao.", {
          code: "WORKING_SNAPSHOT_NOT_FOUND",
          status: 404,
        });
      }

      return parseWorkingSnapshotStorageRow(persisted);
    }

    const updatedRow = await this.delegate.update({
      where: {
        projectId_versionNumber: {
          projectId: parsedInput.projectId,
          versionNumber: WORKING_SNAPSHOT_STORAGE_SLOT,
        },
      },
      data: {
        label: nextLabel,
        snapshot: document as unknown as Prisma.InputJsonObject,
        viewport: viewport as unknown as Prisma.InputJsonObject,
        createdByIdentity: parsedInput.actorIdentity,
        revision: {
          increment: 1,
        },
      },
    });

    return parseWorkingSnapshotStorageRow(updatedRow);
  }
}
