import type { PrismaClient, Project, Workspace } from "@prisma/client";

import { prisma } from "../db/client";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";
import {
  DEMO_STUDIO_PROJECT_SLUG,
  DEMO_STUDIO_WORKSPACE_SLUG,
} from "../demo-seed-scenario";
import type { GraphSnapshot } from "../graph/canonical-graph";
import { loadGraphSnapshot } from "../graph/load-graph-snapshot";
import { createPrismaProjectRepository } from "../repositories/prisma-project.repository";
import { createPrismaWorkspaceRepository } from "../repositories/prisma-workspace.repository";

export type StudioGraphResult =
  | {
      readonly status: "EMPTY";
    }
  | {
      readonly status: "READY";
      readonly workspace: Workspace;
      readonly project: Project;
      readonly snapshot: GraphSnapshot;
    };

export type LoadStudioGraphInput = {
  readonly client?: PrismaClient;
};

export async function loadStudioGraph(
  input: LoadStudioGraphInput = {},
): Promise<StudioGraphResult> {
  const client = input.client ?? prisma;
  const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
  const workspaces = createPrismaWorkspaceRepository(client);
  const projects = createPrismaProjectRepository(client);
  const workspace = await workspaces.findBySlug({
    tenantId,
    slug: DEMO_STUDIO_WORKSPACE_SLUG,
  });

  if (workspace === null) {
    return { status: "EMPTY" };
  }

  const project = await projects.findBySlug({
    tenantId,
    workspaceId: workspace.id,
    slug: DEMO_STUDIO_PROJECT_SLUG,
  });

  if (project === null) {
    return { status: "EMPTY" };
  }

  const snapshot = await loadGraphSnapshot({
    client,
    tenantId,
    projectId: project.id,
  });

  if (snapshot === null) {
    return { status: "EMPTY" };
  }

  return {
    status: "READY",
    workspace,
    project,
    snapshot,
  };
}
