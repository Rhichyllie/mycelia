import { describe, expect, it } from "vitest";
import {
  MATERIALIZED_SNAPSHOT_COMPATIBILITY_MODE,
  buildSnapshotCompatibilityHeaders,
  serializeCompatibilityWorkingSnapshotForHttp,
  serializeSnapshotDiffForHttp,
  serializeSnapshotVersionDetailForHttp,
  serializeSnapshotVersionListForHttp,
  serializeWorkingSnapshotForHttp,
} from "./snapshot-http";

describe("snapshot-http serializers", () => {
  it("serializes working snapshot through the active wire contract without materialized snapshot", () => {
    const serialized = serializeWorkingSnapshotForHttp({
      id: "b22f2835-c768-45f4-a85f-bdc2fd6f2438",
      projectId: "58f3ca26-085e-4237-80d9-adcc42f7142b",
      storageSlot: 1,
      versionNumber: 1,
      revision: 3,
      label: "working-copy",
      document: {
        diagramType: "graph",
        diagramView: "erd",
        nodes: [],
        edges: [],
      },
      viewport: { x: 10, y: 20, zoom: 1.1 },
      createdByIdentity: "dev@mapia.local",
      createdAt: new Date("2026-04-07T16:30:00.000Z"),
      snapshot: {
        diagramType: "graph",
        diagramView: "erd",
        nodes: [],
        edges: [],
        viewport: { x: 10, y: 20, zoom: 1.1 },
      },
    });

    expect(serialized.createdAt).toBe("2026-04-07T16:30:00.000Z");
    expect(serialized.viewport.zoom).toBe(1.1);
    expect(serialized).not.toHaveProperty("snapshot");
  });

  it("serializes the explicit compatibility working snapshot boundary with materialized snapshot", () => {
    const serialized = serializeCompatibilityWorkingSnapshotForHttp({
      id: "b22f2835-c768-45f4-a85f-bdc2fd6f2438",
      projectId: "58f3ca26-085e-4237-80d9-adcc42f7142b",
      storageSlot: 1,
      versionNumber: 1,
      revision: 3,
      document: {
        nodes: [],
        edges: [],
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: new Date("2026-04-07T16:30:00.000Z"),
      snapshot: {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    });

    expect(serialized.snapshot.viewport.zoom).toBe(1);
    expect(
      buildSnapshotCompatibilityHeaders(
        MATERIALIZED_SNAPSHOT_COMPATIBILITY_MODE,
      ),
    ).toEqual({
      "x-mapia-wire-compatibility": "materialized-snapshot",
    });
  });

  it("serializes version detail and diff through the active contract", () => {
    const snapshotVersions = serializeSnapshotVersionListForHttp([
      {
        id: "1aa7a983-1fda-4438-93d7-b964c82685f4",
        projectId: "58f3ca26-085e-4237-80d9-adcc42f7142b",
        label: "Checkpoint manual",
        origin: "manual",
        createdAt: new Date("2026-04-07T16:30:00.000Z"),
      },
    ]);
    const detail = serializeSnapshotVersionDetailForHttp({
      ...snapshotVersions[0],
      createdAt: new Date("2026-04-07T16:30:00.000Z"),
      document: {
        nodes: [],
        edges: [],
      },
      capturedViewport: { x: 10, y: 20, zoom: 1.1 },
      snapshot: {
        nodes: [],
        edges: [],
        viewport: { x: 10, y: 20, zoom: 1.1 },
      },
    });
    const diff = serializeSnapshotDiffForHttp({
      hasChanges: true,
      document: {
        hasChanges: true,
        nodesAdded: ["22222222-2222-4222-8222-222222222222"],
        nodesRemoved: [],
        nodesChanged: [],
        edgesAdded: [],
        edgesRemoved: [],
        edgesChanged: [],
        diagramTypeChanged: false,
        diagramViewChanged: false,
        presentationMetadataChanged: false,
        summary: { added: 1, removed: 0, changed: 0 },
      },
      editorial: {
        viewportChanged: true,
      },
      summary: { added: 1, removed: 0, changed: 1 },
    });

    expect(snapshotVersions[0]?.createdAt).toBe("2026-04-07T16:30:00.000Z");
    expect(detail).not.toHaveProperty("snapshot");
    expect(diff).not.toHaveProperty("nodesAdded");
    expect(diff.document.nodesAdded).toEqual([
      "22222222-2222-4222-8222-222222222222",
    ]);
  });
});
