import { describe, expect, it } from "vitest";
import {
  WorkingSnapshotStateSchema,
  materializeWorkingSnapshotState,
} from "./graph-version";

describe("WorkingSnapshotStateSchema", () => {
  it("materializes working snapshot state with fixed storage slot/version", () => {
    const parsed = materializeWorkingSnapshotState({
      id: "2ec92d9f-f1b5-4aaa-a0a4-13a7ecbd8db6",
      projectId: "58f3ca26-085e-4237-80d9-adcc42f7142b",
      storageSlot: 1,
      versionNumber: 1,
      revision: 3,
      document: {
        diagramType: "graph",
        diagramView: "timeline",
        nodes: [],
        edges: [],
      },
      viewport: { x: 10, y: 20, zoom: 1.2 },
      createdByIdentity: "owner@mapia.local",
      createdAt: new Date("2026-04-07T18:30:00.000Z"),
    });

    expect(parsed.storageSlot).toBe(1);
    expect(parsed.versionNumber).toBe(1);
    expect(parsed.snapshot.viewport.zoom).toBe(1.2);
  });

  it("rejects working snapshot state outside the reserved storage slot", () => {
    expect(() =>
      WorkingSnapshotStateSchema.parse({
        id: "2ec92d9f-f1b5-4aaa-a0a4-13a7ecbd8db6",
        projectId: "58f3ca26-085e-4237-80d9-adcc42f7142b",
        storageSlot: 2,
        versionNumber: 2,
        revision: 1,
        document: {
          nodes: [],
          edges: [],
        },
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: new Date("2026-04-07T18:30:00.000Z"),
      }),
    ).toThrow();
  });
});
