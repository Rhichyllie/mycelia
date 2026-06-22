import type { Prisma, PrismaClient } from "@prisma/client";

import { AppError } from "../../lib/app-error";
import { prisma } from "../db/client";
import { createPrismaEdgeRepository } from "../repositories/prisma-edge.repository";
import { createPrismaExternalRefRepository } from "../repositories/prisma-external-ref.repository";
import { createPrismaNodeRepository } from "../repositories/prisma-node.repository";
import { createPrismaProjectRepository } from "../repositories/prisma-project.repository";
import {
  GraphSnapshotSchema,
  type Edge,
  type ExternalRef,
  type GraphSnapshot,
  type Node,
} from "./canonical-graph";
import { validateGraphSnapshotInvariants } from "./graph-invariants";
import {
  toDbEdgeKind,
  toDbExternalSystem,
  toDbNodeKind,
} from "./kind-mapping";

export type PersistGraphSnapshotResult = {
  readonly projectId: string;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly externalRefCount: number;
};

export type PersistGraphSnapshotInput = {
  readonly client?: PrismaClient;
  readonly tenantId: string;
  readonly projectId: string;
  readonly snapshot: GraphSnapshot;
};

type GraphTransactionClient = Prisma.TransactionClient;

function createRepositories(client: GraphTransactionClient) {
  return {
    projects: createPrismaProjectRepository(client),
    nodes: createPrismaNodeRepository(client),
    edges: createPrismaEdgeRepository(client),
    externalRefs: createPrismaExternalRefRepository(client),
  };
}

function stringifyJsonRecord(value: Record<string, unknown>): string {
  return JSON.stringify(value);
}

function assertProjectScopedSnapshot(input: {
  readonly projectId: string;
  readonly nodes: readonly Node[];
  readonly edges: readonly Edge[];
}) {
  const outOfScopeNode = input.nodes.find(
    (node) => node.projectId !== input.projectId,
  );
  const outOfScopeEdge = input.edges.find(
    (edge) => edge.projectId !== input.projectId,
  );

  if (outOfScopeNode || outOfScopeEdge) {
    throw new AppError("Graph snapshot contains records outside the project.", {
      code: "GRAPH_PROJECT_SCOPE_MISMATCH",
      status: 400,
    });
  }
}

function toNodeCreateInput(input: {
  readonly tenantId: string;
  readonly node: Node;
}) {
  return {
    id: input.node.id,
    tenantId: input.tenantId,
    projectId: input.node.projectId,
    kind: toDbNodeKind(input.node.kind),
    label: input.node.label,
    positionX: input.node.position.x,
    positionY: input.node.position.y,
    data: stringifyJsonRecord(input.node.data),
  };
}

function toEdgeCreateInput(input: {
  readonly tenantId: string;
  readonly edge: Edge;
}) {
  return {
    id: input.edge.id,
    tenantId: input.tenantId,
    projectId: input.edge.projectId,
    sourceNodeId: input.edge.sourceNodeId,
    targetNodeId: input.edge.targetNodeId,
    kind: toDbEdgeKind(input.edge.kind),
    label: input.edge.label ?? null,
    data: stringifyJsonRecord(input.edge.data),
  };
}

function toNodeExternalRefCreateInput(input: {
  readonly tenantId: string;
  readonly projectId: string;
  readonly nodeId: string;
  readonly ref: ExternalRef;
}) {
  return {
    id: input.ref.id,
    tenantId: input.tenantId,
    projectId: input.projectId,
    nodeId: input.nodeId,
    edgeId: null,
    system: toDbExternalSystem(input.ref.system),
    externalId: input.ref.externalId,
    locator: stringifyJsonRecord(input.ref.locator),
    metadata: stringifyJsonRecord(input.ref.metadata),
  };
}

function toEdgeExternalRefCreateInput(input: {
  readonly tenantId: string;
  readonly projectId: string;
  readonly edgeId: string;
  readonly ref: ExternalRef;
}) {
  return {
    id: input.ref.id,
    tenantId: input.tenantId,
    projectId: input.projectId,
    nodeId: null,
    edgeId: input.edgeId,
    system: toDbExternalSystem(input.ref.system),
    externalId: input.ref.externalId,
    locator: stringifyJsonRecord(input.ref.locator),
    metadata: stringifyJsonRecord(input.ref.metadata),
  };
}

export async function persistGraphSnapshot(
  input: PersistGraphSnapshotInput,
): Promise<PersistGraphSnapshotResult> {
  const parsedSnapshot = GraphSnapshotSchema.parse(input.snapshot);
  const snapshot = validateGraphSnapshotInvariants(parsedSnapshot);

  assertProjectScopedSnapshot({
    projectId: input.projectId,
    nodes: snapshot.nodes,
    edges: snapshot.edges,
  });

  const client = input.client ?? prisma;
  const nodeInputs = snapshot.nodes.map((node) =>
    toNodeCreateInput({ tenantId: input.tenantId, node }),
  );
  const edgeInputs = snapshot.edges.map((edge) =>
    toEdgeCreateInput({ tenantId: input.tenantId, edge }),
  );
  const externalRefInputs = [
    ...snapshot.nodes.flatMap((node) =>
      node.externalRefs.map((ref) =>
        toNodeExternalRefCreateInput({
          tenantId: input.tenantId,
          projectId: input.projectId,
          nodeId: node.id,
          ref,
        }),
      ),
    ),
    ...snapshot.edges.flatMap((edge) =>
      edge.externalRefs.map((ref) =>
        toEdgeExternalRefCreateInput({
          tenantId: input.tenantId,
          projectId: input.projectId,
          edgeId: edge.id,
          ref,
        }),
      ),
    ),
  ];

  return await client.$transaction(async (tx) => {
    const repositories = createRepositories(tx);
    const project = await repositories.projects.findById({
      tenantId: input.tenantId,
      id: input.projectId,
    });

    if (project === null) {
      throw new AppError("Graph project does not exist.", {
        code: "GRAPH_PROJECT_NOT_FOUND",
        status: 404,
      });
    }

    await repositories.externalRefs.deleteForProject({
      tenantId: input.tenantId,
      projectId: input.projectId,
    });
    await repositories.edges.deleteForProject({
      tenantId: input.tenantId,
      projectId: input.projectId,
    });
    await repositories.nodes.deleteForProject({
      tenantId: input.tenantId,
      projectId: input.projectId,
    });

    await repositories.nodes.createMany(nodeInputs);
    await repositories.edges.createMany(edgeInputs);
    await repositories.externalRefs.createMany(externalRefInputs);

    return {
      projectId: input.projectId,
      nodeCount: nodeInputs.length,
      edgeCount: edgeInputs.length,
      externalRefCount: externalRefInputs.length,
    };
  });
}
