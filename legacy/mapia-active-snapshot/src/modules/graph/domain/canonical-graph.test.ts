import { describe, expect, it } from "vitest";
import {
  GraphSnapshotBoundarySchema,
  GraphSnapshotDocumentBoundarySchema,
  GraphSnapshotSchema,
} from "@/src/domain/canonical-graph";

describe("GraphSnapshotSchema", () => {
  it("accepts a minimal canonical graph snapshot", () => {
    const snapshot = GraphSnapshotSchema.parse({
      nodes: [
        {
          id: "8f0f4805-5f98-471c-a074-67c196419b15",
          projectId: "58f3ca26-085e-4237-80d9-adcc42f7142b",
          kind: "entity",
          label: "User",
          position: { x: 10, y: 20 },
          data: {},
          externalRefs: [],
        },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1.25 },
      rootNodeName: "Arquitetura Geral",
      allowReapplyLayout: false,
    });

    expect(snapshot.nodes).toHaveLength(1);
    expect(snapshot.viewport.zoom).toBe(1.25);
    expect(snapshot.rootNodeName).toBe("Arquitetura Geral");
    expect(snapshot.allowReapplyLayout).toBe(false);
  });

  it("normalizes legacy snapshot diagramType into canonical type plus explicit view", () => {
    const snapshot = GraphSnapshotSchema.parse({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      diagramType: "erd",
    });

    expect(snapshot.diagramType).toBe("graph");
    expect(snapshot.diagramView).toBe("erd");
  });

  it("rejects incompatible canonical type and diagramView pairs", () => {
    expect(() =>
      GraphSnapshotSchema.parse({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        diagramType: "flow",
        diagramView: "erd",
      }),
    ).toThrow(/diagramView/i);
  });

  it("rejects extra top-level compatibility fields on strict snapshot/document boundaries", () => {
    expect(() =>
      GraphSnapshotBoundarySchema.parse({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        revision: 3,
      }),
    ).toThrow();

    expect(() =>
      GraphSnapshotDocumentBoundarySchema.parse({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }),
    ).toThrow();
  });
});
