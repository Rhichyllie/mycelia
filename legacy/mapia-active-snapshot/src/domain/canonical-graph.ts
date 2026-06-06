import { z } from "zod";
import {
  normalizeDiagramIdentity,
  type CanonicalDiagramType,
  type DiagramView,
} from "./diagram-identity";

export const ExternalSystemSchema = z.enum(["manual", "postgres", "prisma"]);

export const ExternalRefSchema = z.object({
  id: z.string().uuid(),
  system: ExternalSystemSchema,
  externalId: z.string().min(1).max(255),
  locator: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const NodeKindSchema = z.enum([
  "workspace",
  "project",
  "entity",
  "page",
  "flow-step",
  "note",
]);

export const NodeSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  kind: NodeKindSchema,
  label: z.string().min(1).max(200),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.unknown()).default({}),
  externalRefs: z.array(ExternalRefSchema).default([]),
});

export const EdgeKindSchema = z.enum([
  "contains",
  "references",
  "depends-on",
  "flows-to",
  "relates-to",
]);

export const EdgeSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  kind: EdgeKindSchema,
  label: z.string().max(200).optional(),
  data: z.record(z.string(), z.unknown()).default({}),
  externalRefs: z.array(ExternalRefSchema).default([]),
});

export const ViewportStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive(),
});

// Backward-compatible alias used by early Fase 0 modules.
export const ViewportSchema = ViewportStateSchema;

const GraphSnapshotDocumentShape = {
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  // Canonical structural identity of the snapshot. Legacy payloads are
  // normalized at parse time and should stop writing ambiguous values here.
  diagramType: z.string().trim().min(1).max(80).optional(),
  // Explicit visual projection for the current snapshot. This is not the
  // canonical model identity and exists to keep presentation separate.
  diagramView: z.string().trim().min(1).max(80).optional(),
  layoutOptions: z.record(z.string(), z.unknown()).optional(),
  rootNodeName: z.string().max(120).optional(),
  allowReapplyLayout: z.boolean().optional(),
} satisfies z.ZodRawShape;

const GraphSnapshotDocumentRawSchema = z.object(GraphSnapshotDocumentShape);

function normalizeGraphSnapshotDocument(value: z.infer<typeof GraphSnapshotDocumentRawSchema>) {
  const normalizedIdentity = normalizeDiagramIdentity({
    diagramType: value.diagramType,
    diagramView: value.diagramView,
  });

  if (!normalizedIdentity.ok) {
    throw new Error(normalizedIdentity.message);
  }

  const output: {
    nodes: z.infer<typeof NodeSchema>[];
    edges: z.infer<typeof EdgeSchema>[];
    layoutOptions?: Record<string, unknown>;
    rootNodeName?: string;
    allowReapplyLayout?: boolean;
    diagramType?: CanonicalDiagramType;
    diagramView?: DiagramView;
  } = {
    nodes: value.nodes,
    edges: value.edges,
    ...(value.layoutOptions ? { layoutOptions: value.layoutOptions } : {}),
    ...(value.rootNodeName ? { rootNodeName: value.rootNodeName } : {}),
    ...(value.allowReapplyLayout !== undefined
      ? { allowReapplyLayout: value.allowReapplyLayout }
      : {}),
  };

  if (normalizedIdentity.diagramType) {
    output.diagramType = normalizedIdentity.diagramType;
  }

  if (normalizedIdentity.diagramView) {
    output.diagramView = normalizedIdentity.diagramView;
  }

  return output;
}

export const GraphSnapshotDocumentSchema = GraphSnapshotDocumentRawSchema.superRefine(
  (value, ctx) => {
    const normalizedIdentity = normalizeDiagramIdentity({
      diagramType: value.diagramType,
      diagramView: value.diagramView,
    });

    if (!normalizedIdentity.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["diagramType"],
        message: normalizedIdentity.message,
      });
    }
  },
).transform((value) => {
  return normalizeGraphSnapshotDocument(value);
});

export const GraphSnapshotDocumentBoundarySchema = z
  .object(GraphSnapshotDocumentShape)
  .strict()
  .superRefine((value, ctx) => {
    const normalizedIdentity = normalizeDiagramIdentity({
      diagramType: value.diagramType,
      diagramView: value.diagramView,
    });

    if (!normalizedIdentity.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["diagramType"],
        message: normalizedIdentity.message,
      });
    }
  })
  .transform((value) => normalizeGraphSnapshotDocument(value));

const GraphSnapshotRawSchema = GraphSnapshotDocumentRawSchema.extend({
  viewport: ViewportStateSchema,
});

export const GraphSnapshotBoundarySchema = z
  .object({
    ...GraphSnapshotDocumentShape,
    viewport: ViewportStateSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const normalizedIdentity = normalizeDiagramIdentity({
      diagramType: value.diagramType,
      diagramView: value.diagramView,
    });

    if (!normalizedIdentity.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["diagramType"],
        message: normalizedIdentity.message,
      });
    }
  })
  .transform((value) => ({
    ...normalizeGraphSnapshotDocument(value),
    viewport: value.viewport,
  }));

export const GraphSnapshotSchema = GraphSnapshotRawSchema.superRefine(
  (value, ctx) => {
    const normalizedIdentity = normalizeDiagramIdentity({
      diagramType: value.diagramType,
      diagramView: value.diagramView,
    });

    if (!normalizedIdentity.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["diagramType"],
        message: normalizedIdentity.message,
      });
    }
  },
).transform((value) => ({
  ...normalizeGraphSnapshotDocument(value),
  viewport: value.viewport,
}));

export type ExternalSystem = z.infer<typeof ExternalSystemSchema>;
export type ExternalRef = z.infer<typeof ExternalRefSchema>;
export type NodeKind = z.infer<typeof NodeKindSchema>;
export type EdgeKind = z.infer<typeof EdgeKindSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type ViewportState = z.infer<typeof ViewportStateSchema>;
export type Viewport = ViewportState;
export type GraphSnapshotDocument = z.infer<typeof GraphSnapshotDocumentSchema>;
export type GraphSnapshot = z.infer<typeof GraphSnapshotSchema>;

export const ImmutableSnapshotStateSchema = z
  .object({
    document: GraphSnapshotDocumentSchema,
    capturedViewport: ViewportStateSchema,
  })
  .strict();

export const StoredWorkingSnapshotStateSchema = z
  .object({
    snapshot: z.unknown(),
    viewport: z.unknown().optional(),
  })
  .strict()
  .transform((value) => {
    const rawSnapshot =
      value.snapshot && typeof value.snapshot === "object"
        ? (value.snapshot as Record<string, unknown>)
        : {};
    const document = GraphSnapshotDocumentSchema.parse(rawSnapshot);
    const viewport = ViewportStateSchema.parse(
      value.viewport ?? rawSnapshot.viewport ?? { x: 0, y: 0, zoom: 1 },
    );

    return {
      document,
      viewport,
      snapshot: materializeGraphSnapshot({ document, viewport }),
    };
  });

export const StoredImmutableSnapshotStateSchema = z
  .unknown()
  .transform((value) => {
    const raw =
      value && typeof value === "object" ? (value as Record<string, unknown>) : {};

    if ("document" in raw || "capturedViewport" in raw) {
      return ImmutableSnapshotStateSchema.parse({
        document: raw.document,
        capturedViewport: raw.capturedViewport ?? raw.viewport,
      });
    }

    return ImmutableSnapshotStateSchema.parse({
      document: raw,
      capturedViewport: raw.viewport ?? { x: 0, y: 0, zoom: 1 },
    });
  });

export function materializeGraphSnapshot(input: {
  document: GraphSnapshotDocument;
  viewport: ViewportState;
}): GraphSnapshot {
  return GraphSnapshotSchema.parse({
    ...input.document,
    viewport: input.viewport,
  });
}

export function splitGraphSnapshot(snapshot: GraphSnapshot): {
  document: GraphSnapshotDocument;
  viewport: ViewportState;
} {
  const parsed = GraphSnapshotSchema.parse(snapshot);
  const {
    viewport,
    nodes,
    edges,
    diagramType,
    diagramView,
    layoutOptions,
    rootNodeName,
    allowReapplyLayout,
  } = parsed;

  return {
    document: GraphSnapshotDocumentSchema.parse({
      nodes,
      edges,
      ...(diagramType ? { diagramType } : {}),
      ...(diagramView ? { diagramView } : {}),
      ...(layoutOptions ? { layoutOptions } : {}),
      ...(rootNodeName ? { rootNodeName } : {}),
      ...(allowReapplyLayout !== undefined ? { allowReapplyLayout } : {}),
    }),
    viewport,
  };
}

export function parseStoredWorkingSnapshotState(input: {
  snapshot: unknown;
  viewport?: unknown;
}): z.infer<typeof StoredWorkingSnapshotStateSchema> {
  return StoredWorkingSnapshotStateSchema.parse(input);
}

export function parseStoredImmutableSnapshotState(
  input: unknown,
): z.infer<typeof StoredImmutableSnapshotStateSchema> {
  return StoredImmutableSnapshotStateSchema.parse(input);
}

export type ImmutableSnapshotState = z.infer<
  typeof ImmutableSnapshotStateSchema
>;
export type StoredWorkingSnapshotState = z.infer<
  typeof StoredWorkingSnapshotStateSchema
>;
export type StoredImmutableSnapshotState = z.infer<
  typeof StoredImmutableSnapshotStateSchema
>;
