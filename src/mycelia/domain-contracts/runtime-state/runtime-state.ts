import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  ProjectIdSchema,
  RunIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../../foundation/shared-kernel";
import { GovernedRunSchema } from "../../domain-contracts/governed-run";

import { RuntimeStateKindSchema } from "./runtime-state-kind";

const MAX_RUNTIME_STATE_REF_LENGTH = 160;
const MAX_RUNTIME_STATE_METADATA_KEYS = 32;
const MAX_RUNTIME_STATE_SAFE_TEXT_LENGTH = 240;
const UNSAFE_RUNTIME_STATE_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|event[_-]?internals|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|raw|run[_-]?internals|secret|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;
const SAFE_RUNTIME_STATE_REF_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|password|private[_-]?key|raw|secret|tenant[_-]?name|token|\s)/i;

export const RuntimeStateOpaqueReferenceSchema = z
  .string()
  .min(1, "runtime state reference must be non-empty.")
  .max(
    MAX_RUNTIME_STATE_REF_LENGTH,
    `runtime state reference must not exceed ${MAX_RUNTIME_STATE_REF_LENGTH} characters.`,
  )
  .refine(
    (value) => !SAFE_RUNTIME_STATE_REF_PATTERN.test(value),
    "runtime state reference must be opaque and safe.",
  );

export const RuntimeStateIdSchema = RuntimeStateOpaqueReferenceSchema;

const SafeRuntimeStateMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_RUNTIME_STATE_TEXT_PATTERN.test(key),
    "runtime state metadata key is unsafe.",
  );

const SafeRuntimeStateMetadataValueSchema = z.union([
  z
    .string()
    .max(MAX_RUNTIME_STATE_SAFE_TEXT_LENGTH)
    .refine(
      (value) => !UNSAFE_RUNTIME_STATE_TEXT_PATTERN.test(value),
      "runtime state metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeRuntimeStateMetadataSchema = z
  .record(SafeRuntimeStateMetadataKeySchema, SafeRuntimeStateMetadataValueSchema)
  .refine(
    (metadata) => Object.keys(metadata).length <= MAX_RUNTIME_STATE_METADATA_KEYS,
    `runtime state metadata must not exceed ${MAX_RUNTIME_STATE_METADATA_KEYS} keys.`,
  );

export type RuntimeStateOpaqueReference = z.infer<
  typeof RuntimeStateOpaqueReferenceSchema
>;
export type RuntimeStateId = z.infer<typeof RuntimeStateIdSchema>;
export type SafeRuntimeStateMetadata = z.infer<
  typeof SafeRuntimeStateMetadataSchema
>;

export function isRuntimeStateIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

export const RuntimeStateSchema = z
  .object({
    state_id: RuntimeStateIdSchema,
    run_id: RunIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    kind: RuntimeStateKindSchema,
    governed_run_ref: RuntimeStateOpaqueReferenceSchema.optional(),
    governed_run: GovernedRunSchema.optional(),
    version: z
      .number()
      .int("version must be an integer.")
      .positive("version must be positive."),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    data_classification: DataClassificationSchema,
    recorded_at: z
      .string()
      .refine(
        isRuntimeStateIsoDateTime,
        "recorded_at must be an ISO datetime string.",
      ),
    checkpoint_ref: RuntimeStateOpaqueReferenceSchema.optional(),
    previous_state_id: RuntimeStateOpaqueReferenceSchema.optional(),
    metadata: SafeRuntimeStateMetadataSchema.optional(),
  })
  .strict()
  .superRefine((state, context) => {
    if (state.project_id !== undefined && state.workspace_id === undefined) {
      context.addIssue({
        code: "custom",
        message: "project_id requires workspace_id.",
        path: ["project_id"],
      });
    }

    if (
      state.governed_run_ref === undefined &&
      state.governed_run === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "governed run reference is required.",
        path: ["governed_run_ref"],
      });
    }

    if (
      state.governed_run !== undefined &&
      state.governed_run.tenant_id !== state.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "governed run tenant_id must match runtime state tenant_id.",
        path: ["governed_run", "tenant_id"],
      });
    }

    if (
      state.governed_run !== undefined &&
      state.governed_run.run_id !== state.run_id
    ) {
      context.addIssue({
        code: "custom",
        message: "governed run run_id must match runtime state run_id.",
        path: ["governed_run", "run_id"],
      });
    }

    if (
      state.governed_run !== undefined &&
      state.governed_run.status !== state.kind
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime state kind must match governed run status.",
        path: ["kind"],
      });
    }

    if (
      state.governed_run !== undefined &&
      state.workspace_id !== undefined &&
      state.governed_run.workspace_id !== undefined &&
      state.governed_run.workspace_id !== state.workspace_id
    ) {
      context.addIssue({
        code: "custom",
        message: "governed run workspace scope must match runtime state.",
        path: ["governed_run", "workspace_id"],
      });
    }

    if (
      state.governed_run !== undefined &&
      state.project_id !== undefined &&
      state.governed_run.project_id !== undefined &&
      state.governed_run.project_id !== state.project_id
    ) {
      context.addIssue({
        code: "custom",
        message: "governed run project scope must match runtime state.",
        path: ["governed_run", "project_id"],
      });
    }
  });

export type RuntimeState = z.infer<typeof RuntimeStateSchema>;
export type RuntimeStateInput = z.input<typeof RuntimeStateSchema>;

export function isSafeRuntimeStateMetadata(
  input: unknown,
): input is SafeRuntimeStateMetadata {
  return SafeRuntimeStateMetadataSchema.safeParse(input).success;
}
