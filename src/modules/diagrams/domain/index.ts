import type { EdgeKind, NodeKind } from "@/src/domain";
import type { GraphSnapshot } from "@/src/domain";

type TranslationFn = (key: string) => string;

export type DiagramRole =
  | "meta-workspace"
  | "meta-project"
  | "tree-root"
  | "tree-node"
  | "hierarchy-root"
  | "hierarchy-node"
  | "sitemap-home"
  | "sitemap-section"
  | "flow-start"
  | "flow-step"
  | "flow-note"
  | "flow-end"
  | "flow-decision"
  | "mindmap-root"
  | "mindmap-branch"
  | "mindmap-reference"
  | "graph-core"
  | "graph-topic"
  | "graph-supporting"
  | "timeline-milestone"
  | "erd-entity"
  | "erd-comment";

export type ProcessNodeRole = Extract<
  DiagramRole,
  "flow-start" | "flow-step" | "flow-note" | "flow-end" | "flow-decision"
>;

export type ProcessCriticality = "low" | "medium" | "high" | "critical";

export type ProcessOperationalContext = {
  description?: string;
  owner?: string;
  area?: string;
  channel?: string;
  criticality?: ProcessCriticality;
  sla?: string;
  rule?: string;
  exception?: string;
  tags?: string[];
};

function tr(t: TranslationFn | undefined, key: string, fallback: string) {
  return t ? t(key) : fallback;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function readDiagramRoleFromPayload(
  payload: unknown,
): DiagramRole | undefined {
  const role = readRecord(payload)?.diagramRole;
  return typeof role === "string" ? (role as DiagramRole) : undefined;
}

export function writeDiagramRoleToPayload(
  payload: Record<string, unknown>,
  role?: DiagramRole,
) {
  if (!role) {
    const next = { ...payload };
    delete next.diagramRole;
    return next;
  }

  return {
    ...payload,
    diagramRole: role,
  };
}

export function resolveGraphDefaultRoleForKind(
  kind: NodeKind,
): DiagramRole | undefined {
  if (kind === "entity") {
    return "graph-core";
  }
  if (kind === "page") {
    return "graph-supporting";
  }
  return "graph-topic";
}

export function mapGraphRoleToNodeKind(
  role: DiagramRole,
  fallbackKind: NodeKind,
): NodeKind {
  if (role === "graph-core" || role === "graph-topic") {
    return "entity";
  }
  if (role === "graph-supporting") {
    return "page";
  }
  return fallbackKind;
}

export function resolveFlowDiagramRole(input: {
  diagramRole?: DiagramRole;
  explicitRole?: DiagramRole;
  nodeKind?: NodeKind;
  nodeLabel?: string;
  kind?: NodeKind;
  label?: string;
}): ProcessNodeRole {
  const requestedRole = input.explicitRole ?? input.diagramRole;
  if (
    requestedRole === "flow-start" ||
    requestedRole === "flow-step" ||
    requestedRole === "flow-note" ||
    requestedRole === "flow-end" ||
    requestedRole === "flow-decision"
  ) {
    return requestedRole;
  }

  const kind = input.nodeKind ?? input.kind;
  if (kind === "note") {
    return "flow-note";
  }

  const normalizedLabel =
    (input.nodeLabel ?? input.label)?.trim().toLowerCase() ?? "";
  if (normalizedLabel.includes("inicio") || normalizedLabel.includes("start")) {
    return "flow-start";
  }
  if (normalizedLabel.includes("fim") || normalizedLabel.includes("end")) {
    return "flow-end";
  }
  if (
    normalizedLabel.includes("decisao") ||
    normalizedLabel.includes("decision")
  ) {
    return "flow-decision";
  }

  return "flow-step";
}

export function resolveDiagramRole(input: {
  diagramType?: string;
  nodeKind?: NodeKind;
  nodePayload?: unknown;
  nodeLabel?: string;
  layoutMetadata?: { rootNodeName?: string | null };
}): DiagramRole {
  const explicitRole = readDiagramRoleFromPayload(input.nodePayload);
  if (explicitRole) {
    return explicitRole;
  }

  if (input.diagramType === "flow") {
    return resolveFlowDiagramRole({
      kind: input.nodeKind,
      label: input.nodeLabel,
    });
  }

  if (input.diagramType === "tree") {
    return input.layoutMetadata?.rootNodeName &&
      input.nodeLabel === input.layoutMetadata.rootNodeName
      ? "hierarchy-root"
      : "hierarchy-node";
  }

  if (input.diagramType === "sitemap") {
    return "sitemap-section";
  }

  if (input.diagramType === "mindmap") {
    return "mindmap-branch";
  }

  if (input.diagramType === "timeline") {
    return "timeline-milestone";
  }

  if (input.diagramType === "erd") {
    return input.nodeKind === "note" ? "erd-comment" : "erd-entity";
  }

  return resolveGraphDefaultRoleForKind(input.nodeKind ?? "note") ?? "graph-topic";
}

export function resolveGraphNodeKindCopy(
  kind: NodeKind,
  t?: TranslationFn,
) {
  return {
    labelOperational: tr(t, `graph.nodeKinds.${kind}.label`, kind),
    description: tr(
      t,
      `graph.nodeKinds.${kind}.description`,
      "Elemento do grafo canonico.",
    ),
  };
}

export function resolveGraphNodeSemantic(
  input: {
    diagramRole?: DiagramRole;
    kind?: NodeKind;
    label?: string;
    payload?: unknown;
    incomingCount?: number;
    outgoingCount?: number;
  },
  t?: TranslationFn,
) {
  const role = input.diagramRole ?? resolveGraphDefaultRoleForKind(input.kind ?? "note");
  const kind = input.kind ?? "note";

  return {
    role,
    variant:
      role === "graph-core"
        ? "core"
        : role === "graph-supporting"
          ? "supporting"
          : "topic",
    selectionBadgeLabel: tr(t, "graph.selection.node", "No selecionado"),
    roleBadgeLabel: role ?? "graph-topic",
    kindLabel: resolveGraphNodeKindCopy(kind, t).labelOperational,
    kindDescription: resolveGraphNodeKindCopy(kind, t).description,
    summary: tr(t, "graph.node.summary", "No do grafo canonico."),
    footprintLabel: `${input.incomingCount ?? 0} in / ${input.outgoingCount ?? 0} out`,
    connectivityLabel: tr(t, "graph.node.connectivity", "Conectividade"),
    structureTips: [
      tr(t, "graph.node.structureTip", "Mantenha relacoes explicitas e legiveis."),
    ],
  };
}

export function readProcessOperationalContextFromPayload(
  payload: unknown,
): ProcessOperationalContext {
  const record = readRecord(payload);
  const processRecord = readRecord(readRecord(record?.__mapia)?.process);
  const source = processRecord ?? readRecord(record?.process);

  if (!source) {
    return {};
  }

  return {
    description:
      typeof source.description === "string" ? source.description : undefined,
    owner: typeof source.owner === "string" ? source.owner : undefined,
    area: typeof source.area === "string" ? source.area : undefined,
    channel: typeof source.channel === "string" ? source.channel : undefined,
    criticality:
      source.criticality === "low" ||
      source.criticality === "medium" ||
      source.criticality === "high" ||
      source.criticality === "critical"
        ? source.criticality
        : undefined,
    sla: typeof source.sla === "string" ? source.sla : undefined,
    rule: typeof source.rule === "string" ? source.rule : undefined,
    exception: typeof source.exception === "string" ? source.exception : undefined,
    tags: Array.isArray(source.tags)
      ? source.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
  };
}

export function writeProcessOperationalContextToPayload(
  payload: Record<string, unknown>,
  context: ProcessOperationalContext,
) {
  const mapia = readRecord(payload.__mapia) ?? {};
  return {
    ...payload,
    __mapia: {
      ...mapia,
      process: context,
    },
  };
}

export function getProcessRoleSemantics(role: ProcessNodeRole) {
  const mainFlowByRole: Record<
    ProcessNodeRole,
    { minIncoming: number; minOutgoing: number; maxOutgoing: number | null }
  > = {
    "flow-start": { minIncoming: 0, minOutgoing: 1, maxOutgoing: 1 },
    "flow-step": { minIncoming: 1, minOutgoing: 1, maxOutgoing: 1 },
    "flow-decision": { minIncoming: 1, minOutgoing: 2, maxOutgoing: null },
    "flow-end": { minIncoming: 1, minOutgoing: 0, maxOutgoing: 0 },
    "flow-note": { minIncoming: 0, minOutgoing: 0, maxOutgoing: null },
  };

  return {
    role,
    badgeLabel: role,
    kindLabel: role,
    summary: "Etapa de processo.",
    guidanceWhenSparse: "Conecte esta etapa ao fluxo principal.",
    guidanceWhenConnected: "Revise entradas e saidas.",
    mainFlow: mainFlowByRole[role],
  };
}

export function isProcessMainEdgeKind(kind: EdgeKind) {
  return kind === "flows-to" || kind === "depends-on";
}

export function normalizeDiagramSnapshot(input: {
  snapshot: GraphSnapshot;
  diagramTypeEffective?: string;
  rootNodeName?: string;
}): {
  normalizedSnapshot: GraphSnapshot;
  hiddenNodeIds: string[];
  computedRootNodeId?: string;
} {
  const rootName = input.rootNodeName?.trim().toLowerCase();
  const computedRootNodeId = rootName
    ? input.snapshot.nodes.find(
        (node) => node.label.trim().toLowerCase() === rootName,
      )?.id
    : undefined;

  return {
    normalizedSnapshot: input.snapshot,
    hiddenNodeIds: [],
    ...(computedRootNodeId ? { computedRootNodeId } : {}),
  };
}

export function resolveGraphEdgeSemantic(kind: EdgeKind, t?: TranslationFn) {
  const semanticByKind: Record<
    EdgeKind,
    {
      label: string;
      verb: string;
      markerStyle: "closed" | "open" | "none";
      strokeStyle: "solid" | "dashed" | "dotted";
      emphasis: "primary" | "secondary" | "supporting" | "normal";
    }
  > = {
    contains: {
      label: "Contem",
      verb: "contem",
      markerStyle: "closed",
      strokeStyle: "solid",
      emphasis: "primary",
    },
    references: {
      label: "Referencia",
      verb: "referencia",
      markerStyle: "open",
      strokeStyle: "dotted",
      emphasis: "secondary",
    },
    "depends-on": {
      label: "Depende de",
      verb: "depende de",
      markerStyle: "closed",
      strokeStyle: "dashed",
      emphasis: "primary",
    },
    "flows-to": {
      label: "Segue para",
      verb: "segue para",
      markerStyle: "closed",
      strokeStyle: "solid",
      emphasis: "normal",
    },
    "relates-to": {
      label: "Relaciona",
      verb: "relaciona",
      markerStyle: "none",
      strokeStyle: "dashed",
      emphasis: "supporting",
    },
  };
  const semantic = semanticByKind[kind];

  return {
    labelOperational: tr(t, `graph.edgeKinds.${kind}.label`, semantic.label),
    defaultVerbLabel: semantic.verb,
    description: tr(
      t,
      `graph.edgeKinds.${kind}.description`,
      "Relacao do grafo canonico.",
    ),
    markerStyle: semantic.markerStyle,
    strokeStyle: semantic.strokeStyle,
    emphasis: semantic.emphasis,
  };
}

export function resolveGraphActionEdgeVerb(
  actionId: string,
  t?: TranslationFn,
) {
  if (actionId.includes("dependency")) {
    return tr(t, "graph.actions.dependsOn", "depende de");
  }
  if (actionId.includes("supporting")) {
    return tr(t, "graph.actions.references", "apoia");
  }
  return tr(t, "graph.actions.relatesTo", "relaciona");
}

export function listGraphQuickAddRoleOptions(t?: TranslationFn) {
  return [
    {
      role: "graph-core" as const,
      label: tr(t, "graph.roles.core.label", "Componente"),
      description: tr(t, "graph.roles.core.description", "Elemento principal."),
      baseKind: "entity" as const,
    },
    {
      role: "graph-topic" as const,
      label: tr(t, "graph.roles.topic.label", "Topico"),
      description: tr(t, "graph.roles.topic.description", "Conceito conectado."),
      baseKind: "entity" as const,
    },
    {
      role: "graph-supporting" as const,
      label: tr(t, "graph.roles.supporting.label", "Suporte"),
      description: tr(
        t,
        "graph.roles.supporting.description",
        "Artefato de apoio.",
      ),
      baseKind: "page" as const,
    },
  ];
}
