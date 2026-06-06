import { prisma } from "@/src/server/db/client";
import {
  getSnapshotVersionStorageDelegate,
  getWorkingSnapshotStorageDelegate,
} from "@/src/server/db/snapshot-storage";
import {
  ApplyEditorCommandUseCase,
  ApplyEditorCommandsUseCase,
  GetWorkingSnapshotForEditorUseCase,
  SaveEditorFullSnapshotUseCase,
} from "@/src/modules/editor/application";
import { WorkingSnapshotEditorGateway } from "@/src/modules/editor/infrastructure";
import {
  LoadWorkingSnapshotUseCase,
  SaveWorkingSnapshotUseCase,
} from "@/src/modules/graph/application";
import { PrismaWorkingSnapshotRepository } from "@/src/modules/graph/infrastructure";
import {
  CreateSnapshotVersionFromWorkingSnapshotUseCase,
  DiffWorkingSnapshotAgainstVersionUseCase,
  GetSnapshotVersionByIdUseCase,
  ListSnapshotVersionsUseCase,
  RestoreWorkingSnapshotFromVersionUseCase,
} from "@/src/modules/versioning/application";
import { PrismaSnapshotVersionRepository } from "@/src/modules/versioning/infrastructure";

export function createServerRepositories() {
  const workingSnapshotRepository = new PrismaWorkingSnapshotRepository(
    getWorkingSnapshotStorageDelegate(prisma),
  );
  const snapshotVersionRepository = new PrismaSnapshotVersionRepository(
    getSnapshotVersionStorageDelegate(prisma),
  );
  const editorSnapshotGateway = new WorkingSnapshotEditorGateway(
    workingSnapshotRepository,
  );

  return {
    workingSnapshotRepository,
    snapshotVersionRepository,
    editorSnapshotGateway,
  };
}

export function createServerUseCases() {
  const repositories = createServerRepositories();

  return {
    repositories,
    editor: {
      getWorkingSnapshotForEditor: new GetWorkingSnapshotForEditorUseCase({
        editorSnapshotGateway: repositories.editorSnapshotGateway,
      }),
      applyCommand: new ApplyEditorCommandUseCase({
        editorSnapshotGateway: repositories.editorSnapshotGateway,
      }),
      applyCommands: new ApplyEditorCommandsUseCase({
        editorSnapshotGateway: repositories.editorSnapshotGateway,
      }),
      saveFullSnapshot: new SaveEditorFullSnapshotUseCase({
        editorSnapshotGateway: repositories.editorSnapshotGateway,
      }),
    },
    graph: {
      loadWorkingSnapshot: new LoadWorkingSnapshotUseCase({
        workingSnapshotRepository: repositories.workingSnapshotRepository,
      }),
      saveWorkingSnapshot: new SaveWorkingSnapshotUseCase({
        workingSnapshotRepository: repositories.workingSnapshotRepository,
      }),
    },
    versioning: {
      createSnapshotVersionFromWorkingSnapshot:
        new CreateSnapshotVersionFromWorkingSnapshotUseCase({
          workingSnapshotRepository: repositories.workingSnapshotRepository,
          snapshotVersionRepository: repositories.snapshotVersionRepository,
        }),
      listSnapshotVersions: new ListSnapshotVersionsUseCase({
        workingSnapshotRepository: repositories.workingSnapshotRepository,
        snapshotVersionRepository: repositories.snapshotVersionRepository,
      }),
      getSnapshotVersionById: new GetSnapshotVersionByIdUseCase({
        workingSnapshotRepository: repositories.workingSnapshotRepository,
        snapshotVersionRepository: repositories.snapshotVersionRepository,
      }),
      diffWorkingSnapshotAgainstVersion:
        new DiffWorkingSnapshotAgainstVersionUseCase({
          workingSnapshotRepository: repositories.workingSnapshotRepository,
          snapshotVersionRepository: repositories.snapshotVersionRepository,
        }),
      restoreWorkingSnapshotFromVersion:
        new RestoreWorkingSnapshotFromVersionUseCase({
          workingSnapshotRepository: repositories.workingSnapshotRepository,
          snapshotVersionRepository: repositories.snapshotVersionRepository,
        }),
    },
  };
}

export type ServerUseCases = ReturnType<typeof createServerUseCases>;
