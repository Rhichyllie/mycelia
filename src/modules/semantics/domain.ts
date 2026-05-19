import type { EdgeKind, NodeKind } from "@/src/domain";

export const MIN_SEMANTIC_OVERRIDE_REASON_LENGTH = 12;

export type SemanticMode = "operational" | "technical";
export type SemanticSeverity = "error" | "warning" | "suggestion" | "info";
export type SemanticEngineOptions = {
  strictEnabled?: boolean;
  customRulesJson?: Record<string, unknown>;
};

export type SemanticViolation = {
  id: string;
  code: string;
  severity: SemanticSeverity;
  message: string;
  targetType?: "node" | "edge" | "graph";
  targetId?: string;
  details?: Record<string, unknown>;
  suggestedFixes?: Array<{
    id: string;
    label: string;
    description?: string;
    safety?: "safe" | "manual";
    commands?: unknown[];
  }>;
};

export type RepairAction = {
  id: string;
  label: string;
  type?: "change-edge-kind" | "remove-edge" | "change-node-kind";
  edgeId?: string;
  nodeId?: string;
  nextKind?: EdgeKind | NodeKind;
  command?: unknown;
};

export type RepairPlan = {
  summary?: string;
  actions: RepairAction[];
};

type SemanticNode = {
  id: string;
  kind: NodeKind;
  label: string;
  payload?: unknown;
};

type SemanticEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  kind: EdgeKind;
  label?: string;
  payload?: unknown;
};

export function hasMinimumSemanticOverrideReason(reason: string | undefined) {
  return (reason?.trim().length ?? 0) >= MIN_SEMANTIC_OVERRIDE_REASON_LENGTH;
}

export function validateEdgeCreation(input: {
  diagramType?: string;
  mode: SemanticMode;
  sourceNode?: SemanticNode;
  targetNode?: SemanticNode;
  edgeKind: EdgeKind;
}, _options?: SemanticEngineOptions):
  | {
      ok: true;
      allowedEdgeKinds: EdgeKind[];
      recommendedEdgeKind?: EdgeKind;
      violation?: undefined;
    }
  | {
      ok: false;
      allowedEdgeKinds: EdgeKind[];
      recommendedEdgeKind?: EdgeKind;
      violation: SemanticViolation;
    } {
  void _options;
  const allowedEdgeKinds: EdgeKind[] =
    input.diagramType === "flow"
      ? ["flows-to", "references"]
      : input.diagramType === "erd"
        ? ["references"]
        : ["contains", "references", "depends-on", "flows-to", "relates-to"];

  return {
    ok: true,
    allowedEdgeKinds,
    recommendedEdgeKind: allowedEdgeKinds.includes(input.edgeKind)
      ? input.edgeKind
      : allowedEdgeKinds[0],
  };
}

export function validateEdgeKindChange(input: {
  diagramType?: string;
  mode: SemanticMode;
  edge: SemanticEdge;
  sourceNode?: SemanticNode;
  targetNode?: SemanticNode;
  nextKind: EdgeKind;
}, options?: SemanticEngineOptions) {
  return validateEdgeCreation({
    diagramType: input.diagramType,
    mode: input.mode,
    sourceNode: input.sourceNode,
    targetNode: input.targetNode,
    edgeKind: input.nextKind,
  }, options);
}

export function validateNodeKindChange(_input: {
  diagramType?: string;
  mode: SemanticMode;
  nodeId: string;
  nextKind: NodeKind;
  nodes: SemanticNode[];
  edges: SemanticEdge[];
}, _options?: SemanticEngineOptions): {
  violations: SemanticViolation[];
  repairPlan?: RepairPlan;
} {
  void _input;
  void _options;
  return { violations: [] };
}

export function buildRepairPlanForNodeKindChange(): RepairPlan {
  return { actions: [] };
}

export function getSemanticProfile(diagramType?: string) {
  return {
    diagramType: diagramType ?? "graph",
    strict: false,
  };
}

export function runGraphAudit(_graph: {
  nodes: SemanticNode[];
  edges: SemanticEdge[];
  rootNodeId?: string | null;
}, _diagramType?: string, _mode: SemanticMode = "operational", _options?: SemanticEngineOptions) {
  void _graph;
  void _diagramType;
  void _mode;
  void _options;
  return {
    issues: [] as SemanticViolation[],
    bySeverity: {
      error: 0,
      warning: 0,
      suggestion: 0,
      info: 0,
    },
    counters: {
      total: 0,
      nodes: 0,
      edges: 0,
      error: 0,
      warning: 0,
      suggestion: 0,
      info: 0,
    },
  };
}
