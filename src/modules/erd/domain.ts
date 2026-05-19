import type { EdgeKind, NodeKind } from "@/src/domain";
import type { SemanticViolation } from "@/src/modules/semantics/domain";

export type ErdFieldFlag = "PK" | "FK" | "UQ" | "NOT_NULL" | "NULLABLE";
export type ErdCardinalityPreset = "1:1" | "1:N" | "N:1" | "N:N";
export type ErdCardinality = {
  minSource: 0 | 1;
  maxSource: 1 | "N";
  minTarget: 0 | 1;
  maxTarget: 1 | "N";
};

export type ErdField = {
  id: string;
  name: string;
  type: string;
  flags: ErdFieldFlag[];
  references?: {
    entityId: string;
    fieldId?: string;
  };
};

export type ErdEntityPayload = {
  entityId?: string;
  tableName?: string;
  description?: string;
  fields: ErdField[];
};

export type ErdRelationPayload = {
  name?: string;
  description?: string;
  cardinality?: ErdCardinality;
  roles?: {
    sourceRole?: string;
    targetRole?: string;
  };
  materialization?:
    | { mode: "conceptual" }
    | {
        mode: "fk";
        dependentSide: "source" | "target";
        fk: {
          dependentEntityId: string;
          fkFieldIds: string[];
          referencesEntityId: string;
          referencesFieldIds: string[];
          unique?: boolean;
        };
      }
    | { mode: "associative"; associativeEntityId?: string };
  referentialActions?: {
    onDelete?: "restrict" | "cascade" | "setNull" | "noAction";
    onUpdate?: "restrict" | "cascade" | "setNull" | "noAction";
  };
};

export type ErdPolicyConfig = {
  allowConceptualRelations: boolean;
  requirePrimaryKeys: boolean;
  requireForeignKeyMaterialization: boolean;
};

export type ErdRelationRef = {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  kind: EdgeKind;
  payload: ErdRelationPayload;
};

export type ErdEntityRef = {
  id: string;
  label: string;
  kind: NodeKind;
  payload: ErdEntityPayload;
};

export type ErdEditorCommand = {
  type: string;
  [key: string]: unknown;
};

export type ErdSuggestedFix = {
  id: string;
  label: string;
  commands: ErdEditorCommand[];
};

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeField(value: unknown, index: number): ErdField | null {
  const record = readRecord(value);
  if (!record) {
    return null;
  }

  const id = readString(record.id) ?? `field-${index}`;
  const name = readString(record.name) ?? `campo_${index + 1}`;
  const type = readString(record.type) ?? "string";
  const flags = Array.isArray(record.flags)
    ? record.flags.filter((flag): flag is ErdFieldFlag =>
        ["PK", "FK", "UQ", "NOT_NULL", "NULLABLE"].includes(String(flag)),
      )
    : [];

  return {
    id,
    name,
    type,
    flags: flags.length > 0 ? flags : ["NULLABLE"],
  };
}

export function normalizeErdEntityPayload(
  value: unknown,
  options: { entityId?: string; fallbackLabel?: string } = {},
): ErdEntityPayload {
  const record = readRecord(value) ?? {};
  const fields = Array.isArray(record.fields)
    ? record.fields
        .map((field, index) => normalizeField(field, index))
        .filter((field): field is ErdField => Boolean(field))
    : [];

  return {
    entityId: options.entityId,
    tableName: readString(record.tableName) ?? readString(options.fallbackLabel),
    description: readString(record.description),
    fields,
  };
}

export function erdCardinalityFromPreset(
  preset: ErdCardinalityPreset,
): ErdCardinality {
  const [source, target] = preset.split(":") as ["1" | "N", "1" | "N"];
  return {
    minSource: 1,
    maxSource: source === "N" ? "N" : 1,
    minTarget: 1,
    maxTarget: target === "N" ? "N" : 1,
  };
}

export function erdCardinalityToPreset(
  cardinality: ErdCardinality | undefined,
): ErdCardinalityPreset | undefined {
  if (!cardinality) {
    return undefined;
  }

  return `${cardinality.maxSource === "N" ? "N" : "1"}:${
    cardinality.maxTarget === "N" ? "N" : "1"
  }` as ErdCardinalityPreset;
}

export function normalizeErdRelationPayload(
  value: unknown,
  _options: { sourceEntityId?: string; targetEntityId?: string } = {},
): ErdRelationPayload {
  void _options;
  const record = readRecord(value) ?? {};
  const cardinalityRecord = readRecord(record.cardinality);
  const maxSource = cardinalityRecord?.maxSource;
  const maxTarget = cardinalityRecord?.maxTarget;
  const cardinality: ErdCardinality | undefined =
    (maxSource === 1 || maxSource === "N") &&
    (maxTarget === 1 || maxTarget === "N")
      ? {
          minSource: cardinalityRecord?.minSource === 0 ? 0 : 1,
          maxSource,
          minTarget: cardinalityRecord?.minTarget === 0 ? 0 : 1,
          maxTarget,
        }
      : undefined;

  return {
    name: readString(record.name),
    description: readString(record.description),
    cardinality,
    roles: readRecord(record.roles) as ErdRelationPayload["roles"],
    materialization: readRecord(record.materialization) as
      | ErdRelationPayload["materialization"]
      | undefined,
    referentialActions: readRecord(record.referentialActions) as
      | ErdRelationPayload["referentialActions"]
      | undefined,
  };
}

export function normalizeErdPolicyFromCustomRules(
  value: unknown,
): ErdPolicyConfig {
  const erd = readRecord(readRecord(value)?.erd) ?? readRecord(value) ?? {};

  return {
    allowConceptualRelations: erd.allowConceptualRelations !== false,
    requirePrimaryKeys: erd.requirePrimaryKeys === true,
    requireForeignKeyMaterialization:
      erd.requireForeignKeyMaterialization === true,
  };
}

export function mergeErdPolicyIntoCustomRules(input: {
  customRulesJson?: Record<string, unknown> | null;
  erdPolicy: ErdPolicyConfig;
}) {
  return {
    ...(input.customRulesJson ?? {}),
    erd: input.erdPolicy,
  };
}

export function inferDependentSide(input: {
  relation: ErdRelationRef;
  sourceEntity?: ErdEntityRef | null;
  targetEntity?: ErdEntityRef | null;
}): "source" | "target" {
  const preset = erdCardinalityToPreset(input.relation.payload.cardinality);
  if (preset === "N:1") {
    return "source";
  }
  return "target";
}

export function normalizeErdGraphFromSemantic(input: {
  nodes: Array<{
    id: string;
    kind: NodeKind;
    label: string;
    payload?: unknown;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    kind: EdgeKind;
    label?: string;
    payload?: unknown;
  }>;
}) {
  return {
    entities: input.nodes
      .filter((node) => node.kind === "entity")
      .map((node) => ({
        id: node.id,
        label: node.label,
        kind: node.kind,
        payload: normalizeErdEntityPayload(node.payload, {
          entityId: node.id,
          fallbackLabel: node.label,
        }),
      })),
    relations: input.edges
      .filter((edge) => edge.kind === "references")
      .map((edge) => ({
        id: edge.id,
        sourceEntityId: edge.sourceNodeId,
        targetEntityId: edge.targetNodeId,
        kind: edge.kind,
        payload: normalizeErdRelationPayload(edge.payload, {
          sourceEntityId: edge.sourceNodeId,
          targetEntityId: edge.targetNodeId,
        }),
      })),
  };
}

export function validateErdGraphFull(_input: {
  graph: ReturnType<typeof normalizeErdGraphFromSemantic>;
  policy: ErdPolicyConfig;
}): {
  diagnostics: SemanticViolation[];
  bySeverity: { error: number; warning: number; suggestion: number; info: number };
} {
  void _input;
  return {
    diagnostics: [],
    bySeverity: { error: 0, warning: 0, suggestion: 0, info: 0 },
  };
}

export function buildBatchSafeFixCommands(
  _diagnostics: SemanticViolation[],
): ErdEditorCommand[] {
  void _diagnostics;
  return [];
}

export function buildMaterializeFkFix(input: {
  relation: ErdRelationRef;
  sourceEntity: ErdEntityRef;
  targetEntity: ErdEntityRef;
  policy?: ErdPolicyConfig;
  preferredDependentSide?: "source" | "target";
}): ErdSuggestedFix {
  return {
    id: `materialize-fk-${input.relation.id}`,
    label: "Materializar FK",
    commands: [],
  };
}

export function buildConvertToAssociativeFix(input: {
  relation: ErdRelationRef;
  sourceEntity: ErdEntityRef;
  targetEntity: ErdEntityRef;
  policy?: ErdPolicyConfig;
}): ErdSuggestedFix | null {
  return {
    id: `convert-associative-${input.relation.id}`,
    label: "Converter para associativa",
    commands: [],
  };
}

export function buildOneToOneUniqueFix(input: {
  relation: ErdRelationRef;
  sourceEntity: ErdEntityRef;
  targetEntity: ErdEntityRef;
}): ErdSuggestedFix | null {
  return {
    id: `one-to-one-unique-${input.relation.id}`,
    label: "Aplicar unique",
    commands: [],
  };
}
