import { z } from "zod";
import { SnapshotVersionOriginSchema } from "@/src/modules/versioning/domain";
import { MIN_SEMANTIC_OVERRIDE_REASON_LENGTH } from "@/src/modules/semantics/domain";

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
          "allowSemanticOverride exige semanticMode=technical no boundary de restore.",
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

export const CreateSnapshotVersionFromWorkingSnapshotInputSchema = z
  .object({
    projectId: z.string().uuid(),
    label: z.string().trim().min(1).max(200).optional(),
    origin: SnapshotVersionOriginSchema.optional(),
  })
  .strict();

export const ListSnapshotVersionsInputSchema = z
  .object({
    projectId: z.string().uuid(),
  })
  .strict();

export const GetSnapshotVersionByIdInputSchema = z
  .object({
    projectId: z.string().uuid(),
    versionId: z.string().uuid(),
  })
  .strict();

export const DiffWorkingSnapshotAgainstVersionInputSchema = z
  .object({
    projectId: z.string().uuid(),
    versionId: z.string().uuid(),
  })
  .strict();

export const RestoreWorkingSnapshotFromVersionInputSchema =
  withSemanticOverrideContract(
    z
      .object({
        projectId: z.string().uuid(),
        versionId: z.string().uuid(),
        actorIdentity: z.string().trim().min(1).max(255).optional(),
        expectedRevision: z.number().int().nonnegative().optional(),
        semanticMode: z.enum(["operational", "technical"]).optional(),
        allowSemanticOverride: z.boolean().optional(),
        overrideReason: z
          .string()
          .trim()
          .min(MIN_SEMANTIC_OVERRIDE_REASON_LENGTH)
          .max(500)
          .optional(),
      })
      .strict(),
  );

export type CreateSnapshotVersionFromWorkingSnapshotInput = z.infer<
  typeof CreateSnapshotVersionFromWorkingSnapshotInputSchema
>;
export type ListSnapshotVersionsInput = z.infer<
  typeof ListSnapshotVersionsInputSchema
>;
export type GetSnapshotVersionByIdInput = z.infer<
  typeof GetSnapshotVersionByIdInputSchema
>;
export type DiffWorkingSnapshotAgainstVersionInput = z.infer<
  typeof DiffWorkingSnapshotAgainstVersionInputSchema
>;
export type RestoreWorkingSnapshotFromVersionInput = z.infer<
  typeof RestoreWorkingSnapshotFromVersionInputSchema
>;
