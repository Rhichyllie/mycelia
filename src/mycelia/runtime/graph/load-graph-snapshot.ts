import type {
  Edge as PrismaEdge,
  ExternalRef as PrismaExternalRef,
  Node as PrismaNode,
  PrismaClient,
} from "@prisma/client";

import { prisma } from "../db/client";
import { createPrismaEdgeRepository } from "../repositories/prisma-edge.repository";
import { createPrismaExternalRefRepository } from "../repositories/prisma-external-ref.repository";
import { createPrismaNodeRepository } from "../repositories/prisma-node.repository";
import { createPrismaProjectRepository } from "../repositories/prisma-project.repository";
import {
  materializeGraphSnapshot,
  type Edge,
  type ExternalRef,
  type GraphSnapshot,
  type Node,
  type ViewportState,
} from "./canonical-graph";
import {
  fromDbEdgeKind,
  fromDbExternalSystem,
  fromDbNodeKind,
} from "./kind-mapping";

export type LoadGraphSnapshotInput = {
  readonly client?: PrismaClient;
  readonly projectId: string;
  readonly viewport?: ViewportState;
};

function parseJsonRecord(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return parsed as Record<string, unknown>;
}

function externalRefFromRecord(record: PrismaExternalRef): ExternalRef {
  return {
    id: record.id,
    system: fromDbExternalSystem(record.system),
    externalId: record.externalId,
    locator: parseJsonRecord(record.locator),
    metadata: parseJsonRecord(record.metadata),
  };
}

function groupExternalRefsByNode(records: readonly PrismaExternalRef[]) {
  const refsByNode = new Map<string, ExternalRef[]>();

  for (const record of records) {
    if (!record.nodeId) {
      continue;
    }

    const refs = refsByNode.get(record.nodeId) ?? [];
    refs.push(externalRefFromRecord(record));
    refsByNode.set(record.nodeId, refs);
  }

  return refsByNode;
}

function groupExternalRefsByEdge(records: readonly PrismaExternalRef[]) {
  const refsByEdge = new Map<string, ExternalRef[]>();

  for (const record of records) {
    if (!record.edgeId) {
      continue;
    }

    const refs = refsByEdge.get(record.edgeId) ?? [];
    refs.push(externalRefFromRecord(record));
    refsByEdge.set(record.edgeId, refs);
  }

  return refsByEdge;
}

function nodeFromRecord(input: {
  readonly record: PrismaNode;
  readonly externalRefs: readonly ExternalRef[];
}): Node {
  return {
    id: input.record.id,
    projectId: input.record.projectId,
    kind: fromDbNodeKind(input.record.kind),
    label: input.record.label,
    position: {
      x: input.record.positionX,
      y: input.record.positionY,
    },
    data: parseJsonRecord(input.record.data),
    externalRefs: [...input.externalRefs],
  };
}

function edgeFromRecord(input: {
  readonly record: PrismaEdge;
  readonly externalRefs: readonly ExternalRef[];
}): Edge {
  return {
    id: input.record.id,
    projectId: input.record.projectId,
    sourceNodeId: input.record.sourceNodeId,
    targetNodeId: input.record.targetNodeId,
    kind: fromDbEdgeKind(input.record.kind),
    ...(input.record.label ? { label: input.record.label } : {}),
    data: parseJsonRecord(input.record.data),
    externalRefs: [...input.externalRefs],
  };
}

export async function loadGraphSnapshot(
  input: LoadGraphSnapshotInput,
): Promise<GraphSnapshot | null> {
  const client = input.client ?? prisma;
  const projects = createPrismaProjectRepository(client);
  const project = await projects.findById({ id: input.projectId });

  if (project === null) {
    return null;
  }

  const [nodeRecords, edgeRecords, externalRefRecords] = await Promise.all([
    createPrismaNodeRepository(client).listForProject({
      projectId: input.projectId,
    }),
    createPrismaEdgeRepository(client).listForProject({
      projectId: input.projectId,
    }),
    createPrismaExternalRefRepository(client).listForProject({
      projectId: input.projectId,
    }),
  ]);
  const refsByNode = groupExternalRefsByNode(externalRefRecords);
  const refsByEdge = groupExternalRefsByEdge(externalRefRecords);
  const nodes = nodeRecords.map((record) =>
    nodeFromRecord({
      record,
      externalRefs: refsByNode.get(record.id) ?? [],
    }),
  );
  const edges = edgeRecords.map((record) =>
    edgeFromRecord({
      record,
      externalRefs: refsByEdge.get(record.id) ?? [],
    }),
  );

  return materializeGraphSnapshot({
    document: {
      nodes,
      edges,
    },
    viewport: input.viewport ?? { x: 0, y: 0, zoom: 1 },
  });
}