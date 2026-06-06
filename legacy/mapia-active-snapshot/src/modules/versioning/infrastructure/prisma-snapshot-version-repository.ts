import type { Prisma } from "@prisma/client";
import { AppError } from "@/src/lib/app-error";
import type { SnapshotVersionStorageDelegate } from "@/src/server/db/snapshot-storage";
import {
  splitGraphSnapshot,
  parseStoredImmutableSnapshotState,
  materializeGraphSnapshot,
} from "@/src/domain";
import { validateGraphSnapshotInvariants } from "@/src/modules/graph/domain";
import {
  EditorSnapshotVersionSummarySchema,
  SnapshotVersionStoragePayloadSchema,
  materializeEditorSnapshotVersion,
  type EditorSnapshotVersion,
  type EditorSnapshotVersionSummary,
} from "@/src/modules/versioning/domain";
import type {
  CreateSnapshotVersionRecordInput,
  SnapshotVersionRepository,
} from "@/src/modules/versioning/application";
import { CreateSnapshotVersionRecordInputSchema } from "@/src/modules/versioning/application";

type SnapshotVersionStorageRow =
  Awaited<ReturnType<SnapshotVersionStorageDelegate["findFirst"]>> extends infer T
    ? T
    : never;

function invalidSnapshotVersionStorageError(input: {
  projectId: string;
  versionId: string;
}) {
  return new AppError("Storage da versao de snapshot esta invalido.", {
    code: "SNAPSHOT_VERSION_STORAGE_INVALID",
    status: 500,
    details: {
      projectId: input.projectId,
      versionId: input.versionId,
    },
  });
}

function parseEditorSnapshotVersionRow(
  row: NonNullable<SnapshotVersionStorageRow>,
): EditorSnapshotVersion {
  try {
    const normalizedState = parseStoredImmutableSnapshotState(row.snapshot);
    const snapshot = validateGraphSnapshotInvariants(
      materializeGraphSnapshot({
        document: normalizedState.document,
        viewport: normalizedState.capturedViewport,
      }),
    );
    const { document, viewport } = splitGraphSnapshot(snapshot);

    return materializeEditorSnapshotVersion({
      label: row.label ?? undefined,
      id: row.id,
      projectId: row.projectId,
      document,
      capturedViewport: viewport,
      origin: row.origin,
      createdAt: row.createdAt,
    });
  } catch {
    throw invalidSnapshotVersionStorageError({
      projectId: row.projectId,
      versionId: row.id,
    });
  }
}

function toSummary(version: EditorSnapshotVersion): EditorSnapshotVersionSummary {
  return EditorSnapshotVersionSummarySchema.parse({
    id: version.id,
    projectId: version.projectId,
    label: version.label,
    origin: version.origin,
    createdAt: version.createdAt,
  });
}

export class PrismaSnapshotVersionRepository implements SnapshotVersionRepository {
  constructor(private readonly delegate: SnapshotVersionStorageDelegate) {}

  async create(
    input: CreateSnapshotVersionRecordInput,
  ): Promise<EditorSnapshotVersion> {
    const parsedInput = CreateSnapshotVersionRecordInputSchema.parse(input);
    const snapshot = validateGraphSnapshotInvariants(
      materializeGraphSnapshot({
        document: parsedInput.document,
        viewport: parsedInput.capturedViewport,
      }),
    );
    const { document, viewport } = splitGraphSnapshot(snapshot);
    const storagePayload = SnapshotVersionStoragePayloadSchema.parse({
      document,
      capturedViewport: viewport,
    });

    const row = await this.delegate.create({
      data: {
        projectId: parsedInput.projectId,
        label: parsedInput.label,
        origin: parsedInput.origin ?? "manual",
        snapshot: storagePayload as unknown as Prisma.InputJsonObject,
      },
    });

    return parseEditorSnapshotVersionRow(row);
  }

  async listByProject(projectId: string): Promise<EditorSnapshotVersionSummary[]> {
    const rows = await this.delegate.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return rows.map((row) => toSummary(parseEditorSnapshotVersionRow(row)));
  }

  async getById(
    projectId: string,
    versionId: string,
  ): Promise<EditorSnapshotVersion | null> {
    const row = await this.delegate.findFirst({
      where: {
        id: versionId,
        projectId,
      },
    });

    return row ? parseEditorSnapshotVersionRow(row) : null;
  }
}
