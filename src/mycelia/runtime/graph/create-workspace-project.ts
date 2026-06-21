import type { Prisma, PrismaClient } from "@prisma/client";

import { AppError } from "../../lib/app-error";
import { prisma } from "../db/client";
import {
  createPrismaProjectRepository,
  type ProjectTemplate,
} from "../repositories/prisma-project.repository";
import {
  createPrismaWorkspaceRepository,
  type WorkspaceRole,
} from "../repositories/prisma-workspace.repository";

export type CreateWorkspaceProjectSuccess = {
  readonly ok: true;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly membershipId: string;
};

export type CreateWorkspaceProjectFailure = {
  readonly ok: false;
  readonly status: "FAILED_SAFE";
  readonly reasonCode: string;
  readonly safeReason: string;
};

export type CreateWorkspaceProjectResult =
  | CreateWorkspaceProjectSuccess
  | CreateWorkspaceProjectFailure;

export type CreateWorkspaceProjectInput = {
  readonly client?: PrismaClient;
  readonly userId: string;
  readonly workspace: {
    readonly slug: string;
    readonly name: string;
    readonly ownerIdentity?: string | null;
  };
  readonly project: {
    readonly slug: string;
    readonly name: string;
    readonly description?: string | null;
    readonly template: ProjectTemplate;
  };
};

type WorkspaceGraphTransactionClient = Prisma.TransactionClient;

function createRepositories(client: WorkspaceGraphTransactionClient) {
  return {
    workspaces: createPrismaWorkspaceRepository(client),
    projects: createPrismaProjectRepository(client),
  };
}

export async function createWorkspaceProject(
  input: CreateWorkspaceProjectInput,
): Promise<CreateWorkspaceProjectResult> {
  const client = input.client ?? prisma;
  const workspaceId = crypto.randomUUID();
  const projectId = crypto.randomUUID();
  const membershipId = crypto.randomUUID();
  const role: WorkspaceRole = "owner";

  try {
    return await client.$transaction(async (tx) => {
      const repositories = createRepositories(tx);
      const user = await repositories.workspaces.findActiveUserById({
        userId: input.userId,
      });

      if (user === null) {
        throw new AppError("Workspace owner user must exist and be active.", {
          code: "WORKSPACE_OWNER_NOT_FOUND",
          status: 404,
        });
      }

      await repositories.workspaces.create({
        id: workspaceId,
        slug: input.workspace.slug,
        name: input.workspace.name,
        ownerIdentity: input.workspace.ownerIdentity ?? user.email,
      });

      await repositories.projects.create({
        id: projectId,
        workspaceId,
        slug: input.project.slug,
        name: input.project.name,
        description: input.project.description ?? null,
        template: input.project.template,
      });

      await repositories.workspaces.createMembership({
        id: membershipId,
        workspaceId,
        userId: user.id,
        role,
      });

      return {
        ok: true,
        workspaceId,
        projectId,
        membershipId,
      } satisfies CreateWorkspaceProjectSuccess;
    });
  } catch {
    return {
      ok: false,
      status: "FAILED_SAFE",
      reasonCode: "WORKSPACE_PROJECT_CREATE_FAILED",
      safeReason:
        "Workspace and first project creation failed before completing the atomic write path.",
    };
  }
}