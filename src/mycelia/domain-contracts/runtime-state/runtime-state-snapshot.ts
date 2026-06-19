import { z } from "zod";

import {
  DataClassificationSchema,
  RunIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";

import {
  RuntimeStateIdSchema,
  RuntimeStateOpaqueReferenceSchema,
  SafeRuntimeStateMetadataSchema,
  isRuntimeStateIsoDateTime,
} from "./runtime-state";

export const RuntimeStateSnapshotIdSchema =
  RuntimeStateOpaqueReferenceSchema;

export const RuntimeStateSnapshotSchema = z
  .object({
    snapshot_id: RuntimeStateSnapshotIdSchema,
    state_id: RuntimeStateIdSchema,
    run_id: RunIdSchema,
    tenant_id: TenantIdSchema,
    version: z
      .number()
      .int("version must be an integer.")
      .positive("version must be positive."),
    recorded_at: z
      .string()
      .refine(
        isRuntimeStateIsoDateTime,
        "recorded_at must be an ISO datetime string.",
      ),
    data_classification: DataClassificationSchema,
    checkpoint_ref: RuntimeStateOpaqueReferenceSchema.optional(),
    metadata: SafeRuntimeStateMetadataSchema.optional(),
  })
  .strict();

export type RuntimeStateSnapshot = z.infer<typeof RuntimeStateSnapshotSchema>;
export type RuntimeStateSnapshotInput = z.input<
  typeof RuntimeStateSnapshotSchema
>;
