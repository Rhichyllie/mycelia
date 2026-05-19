import { z } from "zod";
import {
  EdgeKindSchema,
  GraphSnapshotBoundarySchema,
  NodeKindSchema,
  ViewportStateSchema,
} from "@/src/domain";
import { MIN_SEMANTIC_OVERRIDE_REASON_LENGTH } from "@/src/modules/semantics/domain";

const JsonRecordSchema = z.record(z.string(), z.unknown());
const FiniteNumberSchema = z.number().finite();
const RequiredLabelSchema = z.string().trim().min(1).max(200);
const OptionalLabelSchema = z.string().trim().max(200);
const SemanticModeSchema = z.enum(["operational", "technical"]);
const EditorCommandMetaSchema = z
  .object({
    repairApplied: z.boolean().optional(),
  })
  .optional();

const NodePositionSchema = z.object({
  x: FiniteNumberSchema,
  y: FiniteNumberSchema,
});

const EditorNodeCreateSchema = z.object({
  id: z.string().uuid(),
  kind: NodeKindSchema,
  label: RequiredLabelSchema,
  position: NodePositionSchema,
  data: JsonRecordSchema.default({}),
});

const EditorEdgeCreateSchema = z.object({
  id: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  kind: EdgeKindSchema,
  label: OptionalLabelSchema.optional(),
  data: JsonRecordSchema.default({}),
});

const EditorNodePatchSchema = z
  .object({
    label: RequiredLabelSchema.optional(),
    kind: NodeKindSchema.optional(),
    data: JsonRecordSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Patch de node deve conter ao menos um campo.",
  });

const EditorEdgePatchSchema = z
  .object({
    label: OptionalLabelSchema.optional(),
    kind: EdgeKindSchema.optional(),
    data: JsonRecordSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Patch de edge deve conter ao menos um campo.",
  });

function withSemanticOverrideContract<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) {
  return schema.superRefine((value, ctx) => {
    const typedValue = value as {
      allowSemanticOverride?: boolean;
      semanticMode?: string;
      overrideReason?: string;
    };

    if (
      typedValue.allowSemanticOverride === true &&
      typedValue.semanticMode !== "technical"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["semanticMode"],
        message:
          "allowSemanticOverride exige semanticMode=technical no boundary do editor.",
      });
    }

    if (
      typedValue.overrideReason !== undefined &&
      typedValue.allowSemanticOverride !== true
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["allowSemanticOverride"],
        message:
          "overrideReason so pode ser enviado quando allowSemanticOverride=true.",
      });
    }

    if (
      typedValue.overrideReason !== undefined &&
      typedValue.semanticMode !== "technical"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["semanticMode"],
        message:
          "overrideReason so pode ser enviado quando semanticMode=technical.",
      });
    }
  }) as typeof schema;
}

export const AddNodeEditorCommandSchema = z.object({
  type: z.literal("addNode"),
  node: EditorNodeCreateSchema,
  meta: EditorCommandMetaSchema,
});

export const UpdateNodeEditorCommandSchema = z.object({
  type: z.literal("updateNode"),
  nodeId: z.string().uuid(),
  patch: EditorNodePatchSchema,
  meta: EditorCommandMetaSchema,
});

export const MoveNodeEditorCommandSchema = z.object({
  type: z.literal("moveNode"),
  nodeId: z.string().uuid(),
  position: NodePositionSchema,
  meta: EditorCommandMetaSchema,
});

export const RemoveNodeEditorCommandSchema = z.object({
  type: z.literal("removeNode"),
  nodeId: z.string().uuid(),
  meta: EditorCommandMetaSchema,
});

export const AddEdgeEditorCommandSchema = z.object({
  type: z.literal("addEdge"),
  edge: EditorEdgeCreateSchema,
  meta: EditorCommandMetaSchema,
});

export const UpdateEdgeEditorCommandSchema = z.object({
  type: z.literal("updateEdge"),
  edgeId: z.string().uuid(),
  patch: EditorEdgePatchSchema,
  meta: EditorCommandMetaSchema,
});

export const RemoveEdgeEditorCommandSchema = z.object({
  type: z.literal("removeEdge"),
  edgeId: z.string().uuid(),
  meta: EditorCommandMetaSchema,
});

export const EditorCommandSchema = z.discriminatedUnion("type", [
  AddNodeEditorCommandSchema,
  UpdateNodeEditorCommandSchema,
  MoveNodeEditorCommandSchema,
  RemoveNodeEditorCommandSchema,
  AddEdgeEditorCommandSchema,
  UpdateEdgeEditorCommandSchema,
  RemoveEdgeEditorCommandSchema,
]);

export const GetWorkingSnapshotForEditorInputSchema = z.object({
  projectId: z.string().uuid(),
});

export const ApplyEditorCommandsInputSchema = withSemanticOverrideContract(
  z
    .object({
      projectId: z.string().uuid(),
      actorIdentity: z.string().email().optional(),
      label: RequiredLabelSchema.optional(),
      expectedRevision: z.number().int().nonnegative().optional(),
      semanticMode: SemanticModeSchema.optional(),
      allowSemanticOverride: z.boolean().optional(),
      overrideReason: z
        .string()
        .trim()
        .min(MIN_SEMANTIC_OVERRIDE_REASON_LENGTH)
        .max(500)
        .optional(),
      commands: z.array(EditorCommandSchema).min(1),
    })
    .strict(),
);

export const ApplyEditorCommandInputSchema = withSemanticOverrideContract(
  z
    .object({
      projectId: z.string().uuid(),
      actorIdentity: z.string().email().optional(),
      label: RequiredLabelSchema.optional(),
      expectedRevision: z.number().int().nonnegative().optional(),
      semanticMode: SemanticModeSchema.optional(),
      allowSemanticOverride: z.boolean().optional(),
      overrideReason: z
        .string()
        .trim()
        .min(MIN_SEMANTIC_OVERRIDE_REASON_LENGTH)
        .max(500)
        .optional(),
      command: EditorCommandSchema,
    })
    .strict(),
);

export const SaveEditorFullSnapshotInputSchema = withSemanticOverrideContract(
  z
    .object({
      projectId: z.string().uuid(),
      actorIdentity: z.string().email().optional(),
      label: RequiredLabelSchema.optional(),
      expectedRevision: z.number().int().nonnegative().optional(),
      semanticMode: SemanticModeSchema.optional(),
      allowSemanticOverride: z.boolean().optional(),
      overrideReason: z
        .string()
        .trim()
        .min(MIN_SEMANTIC_OVERRIDE_REASON_LENGTH)
        .max(500)
        .optional(),
      snapshot: GraphSnapshotBoundarySchema,
    })
    .strict(),
);

export const UpdateEditorViewportInputSchema = z.object({
  viewport: ViewportStateSchema,
});

export type EditorCommand = z.infer<typeof EditorCommandSchema>;
export type GetWorkingSnapshotForEditorInput = z.infer<
  typeof GetWorkingSnapshotForEditorInputSchema
>;
export type ApplyEditorCommandsInput = z.infer<
  typeof ApplyEditorCommandsInputSchema
>;
export type ApplyEditorCommandInput = z.infer<typeof ApplyEditorCommandInputSchema>;
export type SaveEditorFullSnapshotInput = z.infer<
  typeof SaveEditorFullSnapshotInputSchema
>;
