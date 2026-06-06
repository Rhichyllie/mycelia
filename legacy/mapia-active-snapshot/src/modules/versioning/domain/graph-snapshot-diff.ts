import { z } from "zod";
import type {
  Edge,
  GraphSnapshot,
  GraphSnapshotDocument,
  Node,
  ViewportState,
} from "@/src/domain";
import { materializeGraphSnapshot } from "@/src/domain";

export const GraphSnapshotDiffSummarySchema = z.object({
  added: z.number().int().nonnegative(),
  removed: z.number().int().nonnegative(),
  changed: z.number().int().nonnegative(),
}).strict();

export const GraphDocumentDiffSchema = z
  .object({
    hasChanges: z.boolean(),
    nodesAdded: z.array(z.string().uuid()),
    nodesRemoved: z.array(z.string().uuid()),
    nodesChanged: z.array(z.string().uuid()),
    edgesAdded: z.array(z.string().uuid()),
    edgesRemoved: z.array(z.string().uuid()),
    edgesChanged: z.array(z.string().uuid()),
    diagramTypeChanged: z.boolean(),
    diagramViewChanged: z.boolean(),
    presentationMetadataChanged: z.boolean(),
    summary: GraphSnapshotDiffSummarySchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const expectedHasChanges =
      value.nodesAdded.length > 0 ||
      value.nodesRemoved.length > 0 ||
      value.nodesChanged.length > 0 ||
      value.edgesAdded.length > 0 ||
      value.edgesRemoved.length > 0 ||
      value.edgesChanged.length > 0 ||
      value.diagramTypeChanged ||
      value.diagramViewChanged ||
      value.presentationMetadataChanged;

    if (value.hasChanges !== expectedHasChanges) {
      ctx.addIssue({
        code: "custom",
        path: ["hasChanges"],
        message: "Document diff hasChanges must match the nested change vectors.",
      });
    }

    const expectedSummary = {
      added: value.nodesAdded.length + value.edgesAdded.length,
      removed: value.nodesRemoved.length + value.edgesRemoved.length,
      changed:
        value.nodesChanged.length +
        value.edgesChanged.length +
        (value.diagramTypeChanged ? 1 : 0) +
        (value.diagramViewChanged ? 1 : 0) +
        (value.presentationMetadataChanged ? 1 : 0),
    };

    if (
      value.summary.added !== expectedSummary.added ||
      value.summary.removed !== expectedSummary.removed ||
      value.summary.changed !== expectedSummary.changed
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["summary"],
        message: "Document diff summary must match the nested change vectors.",
      });
    }
  });

export const GraphEditorialDiffSchema = z
  .object({
    viewportChanged: z.boolean(),
  })
  .strict();

export const GraphSnapshotDiffSchema = z
  .object({
    hasChanges: z.boolean(),
    document: GraphDocumentDiffSchema,
    editorial: GraphEditorialDiffSchema,
    summary: GraphSnapshotDiffSummarySchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const expectedHasChanges =
      value.document.hasChanges || value.editorial.viewportChanged;

    if (value.hasChanges !== expectedHasChanges) {
      ctx.addIssue({
        code: "custom",
        path: ["hasChanges"],
        message: "Snapshot diff hasChanges must match document/editorial changes.",
      });
    }

    const expectedSummary = {
      added: value.document.summary.added,
      removed: value.document.summary.removed,
      changed:
        value.document.summary.changed + (value.editorial.viewportChanged ? 1 : 0),
    };

    if (
      value.summary.added !== expectedSummary.added ||
      value.summary.removed !== expectedSummary.removed ||
      value.summary.changed !== expectedSummary.changed
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["summary"],
        message: "Snapshot diff summary must match document/editorial changes.",
      });
    }
  });

export type GraphSnapshotDiffSummary = z.infer<
  typeof GraphSnapshotDiffSummarySchema
>;
export type GraphDocumentDiff = z.infer<typeof GraphDocumentDiffSchema>;
export type GraphEditorialDiff = z.infer<typeof GraphEditorialDiffSchema>;
export type GraphSnapshotDiff = z.infer<typeof GraphSnapshotDiffSchema>;

type SnapshotEntity = Node | Edge;

type ComputeGraphSnapshotDiffInput =
  | {
      baseSnapshot: GraphSnapshot;
      targetSnapshot: GraphSnapshot;
    }
  | {
      baseDocument: GraphSnapshotDocument;
      baseViewport: ViewportState;
      targetDocument: GraphSnapshotDocument;
      targetViewport: ViewportState;
    };

function stableNormalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stableNormalizeValue(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return Object.fromEntries(
      Object.keys(record)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, stableNormalizeValue(record[key])]),
    );
  }

  return value;
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(stableNormalizeValue(value));
}

function indexById<T extends SnapshotEntity>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function compareEntitiesById<T extends SnapshotEntity>(
  baseItems: T[],
  targetItems: T[],
) {
  const baseById = indexById(baseItems);
  const targetById = indexById(targetItems);

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const targetItem of targetItems) {
    if (!baseById.has(targetItem.id)) {
      added.push(targetItem.id);
    }
  }

  for (const baseItem of baseItems) {
    if (!targetById.has(baseItem.id)) {
      removed.push(baseItem.id);
      continue;
    }

    const targetItem = targetById.get(baseItem.id);

    if (!targetItem) {
      continue;
    }

    if (stableSerialize(baseItem) !== stableSerialize(targetItem)) {
      changed.push(baseItem.id);
    }
  }

  added.sort((left, right) => left.localeCompare(right));
  removed.sort((left, right) => left.localeCompare(right));
  changed.sort((left, right) => left.localeCompare(right));

  return { added, removed, changed };
}

function normalizeDiffInput(input: ComputeGraphSnapshotDiffInput) {
  if ("baseSnapshot" in input) {
    return {
      base: input.baseSnapshot,
      target: input.targetSnapshot,
    };
  }

  return {
    base: materializeGraphSnapshot({
      document: input.baseDocument,
      viewport: input.baseViewport,
    }),
    target: materializeGraphSnapshot({
      document: input.targetDocument,
      viewport: input.targetViewport,
    }),
  };
}

export function computeGraphSnapshotDiff(
  input: ComputeGraphSnapshotDiffInput,
): GraphSnapshotDiff {
  const { base, target } = normalizeDiffInput(input);
  const nodesDiff = compareEntitiesById(base.nodes, target.nodes);
  const edgesDiff = compareEntitiesById(base.edges, target.edges);
  const diagramTypeChanged =
    stableSerialize(base.diagramType) !== stableSerialize(target.diagramType);
  const diagramViewChanged =
    stableSerialize(base.diagramView) !== stableSerialize(target.diagramView);
  const presentationMetadataChanged =
    stableSerialize({
      layoutOptions: base.layoutOptions,
      rootNodeName: base.rootNodeName,
      allowReapplyLayout: base.allowReapplyLayout,
    }) !==
    stableSerialize({
      layoutOptions: target.layoutOptions,
      rootNodeName: target.rootNodeName,
      allowReapplyLayout: target.allowReapplyLayout,
    });
  const viewportChanged =
    stableSerialize(base.viewport) !== stableSerialize(target.viewport);
  const documentSummary = {
    added: nodesDiff.added.length + edgesDiff.added.length,
    removed: nodesDiff.removed.length + edgesDiff.removed.length,
    changed:
      nodesDiff.changed.length +
      edgesDiff.changed.length +
      (diagramTypeChanged ? 1 : 0) +
      (diagramViewChanged ? 1 : 0) +
      (presentationMetadataChanged ? 1 : 0),
  };
  const summary = {
    added: documentSummary.added,
    removed: documentSummary.removed,
    changed: documentSummary.changed + (viewportChanged ? 1 : 0),
  };
  const document = {
    hasChanges:
      documentSummary.added > 0 ||
      documentSummary.removed > 0 ||
      documentSummary.changed > 0,
    nodesAdded: nodesDiff.added,
    nodesRemoved: nodesDiff.removed,
    nodesChanged: nodesDiff.changed,
    edgesAdded: edgesDiff.added,
    edgesRemoved: edgesDiff.removed,
    edgesChanged: edgesDiff.changed,
    diagramTypeChanged,
    diagramViewChanged,
    presentationMetadataChanged,
    summary: documentSummary,
  };

  return GraphSnapshotDiffSchema.parse({
    hasChanges:
      document.hasChanges || viewportChanged,
    document,
    editorial: {
      viewportChanged,
    },
    summary,
  });
}
