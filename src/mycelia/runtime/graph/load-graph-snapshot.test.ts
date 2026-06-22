import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { upsertAppUserByEmail } from "../auth/auth-user-store";
import {
  createPostgresTestClient,
  dropPostgresTestSchema,
} from "../db/postgres-test-database";
import type { GraphSnapshot } from "./canonical-graph";
import { createWorkspaceProject } from "./create-workspace-project";
import { validateGraphSnapshotInvariants } from "./graph-invariants";
import { loadGraphSnapshot } from "./load-graph-snapshot";
import { persistGraphSnapshot } from "./persist-graph-snapshot";

const testSchemas: string[] = [];
const TENANT_ID = "tenant_engine_load_test";

async function createTempClient() {
  const testDatabase = await createPostgresTestClient("mycelia_engine_load");

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
    email: `load-owner-${crypto.randomUUID()}@example.com`,
    displayName: "Load Owner",
  });
  const result = await createWorkspaceProject({
    client,
    tenantId: TENANT_ID,
    userId: user.id,
    workspace: {
      slug: `load-workspace-${crypto.randomUUID()}`,
      name: "Load Workspace",
    },
    project: {
      slug: "load-graph",
      name: "Load Graph",
      template: "graph",
    },
  });

  if (!result.ok) {
    throw new Error(result.safeReason);
  }

  return result.projectId;
}

function graphSnapshot(projectId: string): GraphSnapshot {
  const firstNodeId = crypto.randomUUID();
  const secondNodeId = crypto.randomUUID();

  return {
    nodes: [
      {
        id: firstNodeId,
        projectId,
        kind: "page",
        label: "Request",
        position: { x: 100, y: 200 },
        data: { route: "/request" },
        externalRefs: [
          {
            id: crypto.randomUUID(),
            system: "postgres",
            externalId: "request-table",
            locator: { table: "requests" },
            metadata: { readonly: true },
          },
        ],
      },
      {
        id: secondNodeId,
        projectId,
        kind: "flow-step",
        label: "Decision",
        position: { x: 300, y: 200 },
        data: { gate: "approval" },
        externalRefs: [],
      },
    ],
    edges: [
      {
        id: crypto.randomUUID(),
        projectId,
        sourceNodeId: firstNodeId,
        targetNodeId: secondNodeId,
        kind: "flows-to",
        label: "moves to",
        data: { ordered: true },
        externalRefs: [],
      },
    ],
    viewport: { x: 10, y: 20, zoom: 1.5 },
  };
}

function normalizeSnapshot(snapshot: GraphSnapshot) {
  return {
    ...snapshot,
    nodes: [...snapshot.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...snapshot.edges].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

describe("graph snapshot loading", () => {
  it("loads null for a missing project", async () => {
    const { client } = await createTempClient();

    try {
      await expect(
        loadGraphSnapshot({
          client,
          tenantId: TENANT_ID,
          projectId: crypto.randomUUID(),
        }),
      ).resolves.toBeNull();
    } finally {
      await client.$disconnect();
    }
  });

  it("round-trips a persisted graph into a valid domain snapshot", async () => {
    const { client } = await createTempClient();

    try {
      const projectId = await createProject(client);
      const snapshot = graphSnapshot(projectId);
      await persistGraphSnapshot({
        client,
        tenantId: TENANT_ID,
        projectId,
        snapshot,
      });
      const loaded = await loadGraphSnapshot({
        client,
        tenantId: TENANT_ID,
        projectId,
        viewport: snapshot.viewport,
      });

      expect(loaded).not.toBeNull();

      if (loaded === null) {
        throw new Error("Expected graph snapshot to load from PostgreSQL.");
      }

      expect(validateGraphSnapshotInvariants(loaded)).toEqual(loaded);
      expect(normalizeSnapshot(loaded)).toEqual(normalizeSnapshot(snapshot));
    } finally {
      await client.$disconnect();
    }
  });
});
