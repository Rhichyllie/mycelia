import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { upsertAppUserByEmail } from "../auth/auth-user-store";
import {
  createPostgresTestClient,
  dropPostgresTestSchema,
} from "../db/postgres-test-database";
import { createWorkspaceProject } from "./create-workspace-project";
import type { GraphSnapshot } from "./canonical-graph";
import { persistGraphSnapshot } from "./persist-graph-snapshot";

const testSchemas: string[] = [];
const TENANT_ID = "tenant_engine_persist_test";

async function createTempClient() {
  const testDatabase = await createPostgresTestClient("mycelia_engine_persist");

  testSchemas.push(testDatabase.schema);
  return { client: testDatabase.client, schema: testDatabase.schema };
}

afterEach(async () => {
  for (const schema of testSchemas.splice(0)) {
    await dropPostgresTestSchema(schema);
  }
});

async function createProject(client: PrismaClient) {
  const user = await upsertAppUserByEmail({
    client,
    tenantId: TENANT_ID,
    email: `graph-owner-${crypto.randomUUID()}@example.com`,
    displayName: "Graph Owner",
  });
  const result = await createWorkspaceProject({
    client,
    tenantId: TENANT_ID,
    userId: user.id,
    workspace: {
      slug: `workspace-${crypto.randomUUID()}`,
      name: "Graph Workspace",
    },
    project: {
      slug: "graph-project",
      name: "Graph Project",
      template: "graph",
    },
  });

  if (!result.ok) {
    throw new Error(result.safeReason);
  }

  return result.projectId;
}

function graphSnapshot(projectId: string): GraphSnapshot {
  const sourceNodeId = crypto.randomUUID();
  const targetNodeId = crypto.randomUUID();

  return {
    nodes: [
      {
        id: sourceNodeId,
        projectId,
        kind: "flow-step",
        label: " Intake ",
        position: { x: 12.5, y: 24.25 },
        data: { stage: "intake" },
        externalRefs: [
          {
            id: crypto.randomUUID(),
            system: "manual",
            externalId: "manual-node-intake",
            locator: { section: "A" },
            metadata: { confidence: 1 },
          },
        ],
      },
      {
        id: targetNodeId,
        projectId,
        kind: "entity",
        label: "Approval",
        position: { x: 200, y: 100 },
        data: { stage: "approval" },
        externalRefs: [],
      },
    ],
    edges: [
      {
        id: crypto.randomUUID(),
        projectId,
        sourceNodeId,
        targetNodeId,
        kind: "depends-on",
        label: "requires",
        data: { dependency: true },
        externalRefs: [
          {
            id: crypto.randomUUID(),
            system: "prisma",
            externalId: "edge-dependency",
            locator: { model: "Dependency" },
            metadata: { synced: false },
          },
        ],
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

function replacementSnapshot(projectId: string): GraphSnapshot {
  return {
    nodes: [
      {
        id: crypto.randomUUID(),
        projectId,
        kind: "note",
        label: "Replacement",
        position: { x: -10, y: 50 },
        data: { replacement: true },
        externalRefs: [],
      },
    ],
    edges: [],
    viewport: { x: 4, y: 8, zoom: 1.25 },
  };
}

describe("graph snapshot persistence", () => {
  it("persists nodes, edges, external refs, flattened positions, and mapped kinds", async () => {
    const { client } = await createTempClient();

    try {
      const projectId = await createProject(client);
      const snapshot = graphSnapshot(projectId);
      const result = await persistGraphSnapshot({
        client,
        tenantId: TENANT_ID,
        projectId,
        snapshot,
      });
      const [nodes, edges, externalRefs] = await Promise.all([
        client.node.findMany({
          where: { tenantId: TENANT_ID, projectId },
          orderBy: { label: "asc" },
        }),
        client.edge.findMany({ where: { tenantId: TENANT_ID, projectId } }),
        client.externalRef.findMany({
          where: { tenantId: TENANT_ID, projectId },
        }),
      ]);

      expect(result).toEqual({
        projectId,
        nodeCount: 2,
        edgeCount: 1,
        externalRefCount: 2,
      });
      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
      expect(externalRefs).toHaveLength(2);
      expect(nodes.find((node) => node.label === "Intake")).toMatchObject({
        kind: "flow_step",
        positionX: 12.5,
        positionY: 24.25,
        data: JSON.stringify({ stage: "intake" }),
      });
      expect(edges[0]).toMatchObject({
        kind: "depends_on",
        data: JSON.stringify({ dependency: true }),
      });
      expect(externalRefs.map((ref) => ref.system).sort()).toEqual([
        "manual",
        "prisma",
      ]);
    } finally {
      await client.$disconnect();
    }
  });

  it("replaces a previous project graph instead of appending to it", async () => {
    const { client } = await createTempClient();

    try {
      const projectId = await createProject(client);
      await persistGraphSnapshot({
        client,
        tenantId: TENANT_ID,
        projectId,
        snapshot: graphSnapshot(projectId),
      });
      await persistGraphSnapshot({
        client,
        tenantId: TENANT_ID,
        projectId,
        snapshot: replacementSnapshot(projectId),
      });

      expect(await client.node.count({ where: { tenantId: TENANT_ID, projectId } })).toBe(1);
      expect(await client.edge.count({ where: { tenantId: TENANT_ID, projectId } })).toBe(0);
      expect(await client.externalRef.count({ where: { tenantId: TENANT_ID, projectId } })).toBe(0);
      await expect(
        client.node.findFirstOrThrow({
          where: { tenantId: TENANT_ID, projectId },
        }),
      ).resolves.toMatchObject({
        kind: "note",
        label: "Replacement",
        positionX: -10,
        positionY: 50,
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("validates graph invariants before writing anything", async () => {
    const { client } = await createTempClient();

    try {
      const projectId = await createProject(client);
      const duplicateNodeId = crypto.randomUUID();
      const orphanSource = crypto.randomUUID();
      const validTarget = crypto.randomUUID();
      const duplicateRelationSource = crypto.randomUUID();
      const duplicateRelationTarget = crypto.randomUUID();
      const duplicateNodeSnapshot: GraphSnapshot = {
        nodes: [
          {
            id: duplicateNodeId,
            projectId,
            kind: "entity",
            label: "Duplicate A",
            position: { x: 0, y: 0 },
            data: {},
            externalRefs: [],
          },
          {
            id: duplicateNodeId,
            projectId,
            kind: "entity",
            label: "Duplicate B",
            position: { x: 10, y: 10 },
            data: {},
            externalRefs: [],
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };
      const orphanEdgeSnapshot: GraphSnapshot = {
        nodes: [
          {
            id: validTarget,
            projectId,
            kind: "entity",
            label: "Target",
            position: { x: 0, y: 0 },
            data: {},
            externalRefs: [],
          },
        ],
        edges: [
          {
            id: crypto.randomUUID(),
            projectId,
            sourceNodeId: orphanSource,
            targetNodeId: validTarget,
            kind: "contains",
            data: {},
            externalRefs: [],
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
      };
      const duplicateRelationSnapshot: GraphSnapshot = {
        nodes: [
          {
            id: duplicateRelationSource,
            projectId,
            kind: "entity",
            label: "Source",
            position: { x: 0, y: 0 },
            data: {},
            externalRefs: [],
          },
          {
            id: duplicateRelationTarget,
            projectId,
            kind: "entity",
            label: "Target",
            position: { x: 10, y: 10 },
            data: {},
            externalRefs: [],
          },
        ],
        edges: [
          {
            id: crypto.randomUUID(),
            projectId,
            sourceNodeId: duplicateRelationSource,
            targetNodeId: duplicateRelationTarget,
            kind: "contains",
            data: {},
            externalRefs: [],
          },
          {
            id: crypto.randomUUID(),
            projectId,
            sourceNodeId: duplicateRelationSource,
            targetNodeId: duplicateRelationTarget,
            kind: "contains",
            data: {},
            externalRefs: [],
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      await expect(
        persistGraphSnapshot({
          client,
          tenantId: TENANT_ID,
          projectId,
          snapshot: duplicateNodeSnapshot,
        }),
      ).rejects.toMatchObject({ code: "GRAPH_DUPLICATE_NODE_ID" });
      await expect(
        persistGraphSnapshot({
          client,
          tenantId: TENANT_ID,
          projectId,
          snapshot: orphanEdgeSnapshot,
        }),
      ).rejects.toMatchObject({ code: "GRAPH_ORPHAN_EDGE" });
      await expect(
        persistGraphSnapshot({
          client,
          tenantId: TENANT_ID,
          projectId,
          snapshot: duplicateRelationSnapshot,
        }),
      ).rejects.toMatchObject({ code: "GRAPH_DUPLICATE_EDGE_RELATION" });
      expect(await client.node.count({ where: { tenantId: TENANT_ID, projectId } })).toBe(0);
      expect(await client.edge.count({ where: { tenantId: TENANT_ID, projectId } })).toBe(0);
      expect(await client.externalRef.count({ where: { tenantId: TENANT_ID, projectId } })).toBe(0);
    } finally {
      await client.$disconnect();
    }
  });
});
