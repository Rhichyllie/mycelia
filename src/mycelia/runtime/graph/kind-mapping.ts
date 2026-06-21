import { AppError } from "../../lib/app-error";
import type { EdgeKind, ExternalSystem, NodeKind } from "./canonical-graph";

export type DbNodeKind =
  | "workspace"
  | "project"
  | "entity"
  | "page"
  | "flow_step"
  | "note";

export type DbEdgeKind =
  | "contains"
  | "references"
  | "depends_on"
  | "flows_to"
  | "relates_to";

export type DbExternalSystem = "manual" | "postgres" | "prisma";

const NODE_KIND_TO_DB = {
  workspace: "workspace",
  project: "project",
  entity: "entity",
  page: "page",
  "flow-step": "flow_step",
  note: "note",
} as const satisfies Record<NodeKind, DbNodeKind>;

const NODE_KIND_FROM_DB = {
  workspace: "workspace",
  project: "project",
  entity: "entity",
  page: "page",
  flow_step: "flow-step",
  note: "note",
} as const satisfies Record<DbNodeKind, NodeKind>;

const EDGE_KIND_TO_DB = {
  contains: "contains",
  references: "references",
  "depends-on": "depends_on",
  "flows-to": "flows_to",
  "relates-to": "relates_to",
} as const satisfies Record<EdgeKind, DbEdgeKind>;

const EDGE_KIND_FROM_DB = {
  contains: "contains",
  references: "references",
  depends_on: "depends-on",
  flows_to: "flows-to",
  relates_to: "relates-to",
} as const satisfies Record<DbEdgeKind, EdgeKind>;

const EXTERNAL_SYSTEMS = new Set<DbExternalSystem>([
  "manual",
  "postgres",
  "prisma",
]);

function failUnknownKind(kind: string, code: string): never {
  throw new AppError(`Graph persistence kind is not recognized: ${kind}`, {
    code,
    status: 400,
  });
}

export function toDbNodeKind(kind: NodeKind): DbNodeKind {
  return NODE_KIND_TO_DB[kind];
}

export function fromDbNodeKind(kind: string): NodeKind {
  return NODE_KIND_FROM_DB[kind as DbNodeKind] ?? failUnknownKind(
    kind,
    "GRAPH_NODE_KIND_UNKNOWN",
  );
}

export function toDbEdgeKind(kind: EdgeKind): DbEdgeKind {
  return EDGE_KIND_TO_DB[kind];
}

export function fromDbEdgeKind(kind: string): EdgeKind {
  return EDGE_KIND_FROM_DB[kind as DbEdgeKind] ?? failUnknownKind(
    kind,
    "GRAPH_EDGE_KIND_UNKNOWN",
  );
}

export function toDbExternalSystem(system: ExternalSystem): DbExternalSystem {
  if (!EXTERNAL_SYSTEMS.has(system as DbExternalSystem)) {
    failUnknownKind(system, "GRAPH_EXTERNAL_SYSTEM_UNKNOWN");
  }

  return system as DbExternalSystem;
}

export function fromDbExternalSystem(system: string): ExternalSystem {
  if (!EXTERNAL_SYSTEMS.has(system as DbExternalSystem)) {
    failUnknownKind(system, "GRAPH_EXTERNAL_SYSTEM_UNKNOWN");
  }

  return system as ExternalSystem;
}