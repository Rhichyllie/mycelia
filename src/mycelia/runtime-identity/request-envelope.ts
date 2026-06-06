import { z } from "zod";

import {
  ActorIdSchema,
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  IdempotencyKeySchema,
  ProjectIdSchema,
  RequestIdSchema,
  RuntimeIdentityIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../shared-kernel";
import {
  OrganizationalScopeSchema,
  type OrganizationalScope,
} from "../tenancy-boundaries";

import { RequestOriginSchema } from "./request-origin";

const MAX_METADATA_KEYS = 32;
const UNSAFE_METADATA_PATTERN =
  /(authorization|api[_-]?key|bearer|credential|password|payload|raw|secret|token|user[_-]?content)/i;

const SafeMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_METADATA_PATTERN.test(key),
    "metadata key is unsafe.",
  );

const SafeMetadataValueSchema = z.union([
  z
    .string()
    .max(240)
    .refine(
      (value) => !UNSAFE_METADATA_PATTERN.test(value),
      "metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeRequestMetadataSchema = z
  .record(SafeMetadataKeySchema, SafeMetadataValueSchema)
  .refine(
    (metadata) => Object.keys(metadata).length <= MAX_METADATA_KEYS,
    `metadata must not exceed ${MAX_METADATA_KEYS} keys.`,
  );

export type SafeRequestMetadata = z.infer<typeof SafeRequestMetadataSchema>;

function isIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function deriveOrganizationalScope(input: {
  readonly tenant_id: z.infer<typeof TenantIdSchema>;
  readonly workspace_id?: z.infer<typeof WorkspaceIdSchema>;
  readonly project_id?: z.infer<typeof ProjectIdSchema>;
}): OrganizationalScope {
  return {
    tenant_id: input.tenant_id,
    ...(input.workspace_id === undefined
      ? {}
      : { workspace_id: input.workspace_id }),
    ...(input.project_id === undefined ? {} : { project_id: input.project_id }),
  };
}

export const RequestEnvelopeSchema = z
  .object({
    request_id: RequestIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    actor_id: ActorIdSchema.optional(),
    runtime_identity_id: RuntimeIdentityIdSchema,
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    origin: RequestOriginSchema,
    purpose: z
      .string()
      .min(1, "purpose is required.")
      .max(512, "purpose must not exceed 512 characters."),
    data_classification: DataClassificationSchema,
    received_at: z
      .string()
      .refine(isIsoDateTime, "received_at must be an ISO datetime string."),
    idempotency_key: IdempotencyKeySchema.optional(),
    organizational_scope: OrganizationalScopeSchema.optional(),
    metadata: SafeRequestMetadataSchema.optional(),
  })
  .strict()
  .superRefine((envelope, context) => {
    if (
      envelope.project_id !== undefined &&
      envelope.workspace_id === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "project_id requires workspace_id.",
        path: ["project_id"],
      });
    }

    if (envelope.organizational_scope !== undefined) {
      if (envelope.organizational_scope.tenant_id !== envelope.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "organizational_scope tenant_id must match envelope tenant_id.",
          path: ["organizational_scope", "tenant_id"],
        });
      }

      if (
        envelope.organizational_scope.workspace_id !== envelope.workspace_id
      ) {
        context.addIssue({
          code: "custom",
          message:
            "organizational_scope workspace_id must match envelope workspace_id.",
          path: ["organizational_scope", "workspace_id"],
        });
      }

      if (envelope.organizational_scope.project_id !== envelope.project_id) {
        context.addIssue({
          code: "custom",
          message:
            "organizational_scope project_id must match envelope project_id.",
          path: ["organizational_scope", "project_id"],
        });
      }
    }
  })
  .transform((envelope) => ({
    ...envelope,
    organizational_scope:
      envelope.organizational_scope ?? deriveOrganizationalScope(envelope),
  }));

export type RequestEnvelope = z.infer<typeof RequestEnvelopeSchema>;
export type RequestEnvelopeInput = z.input<typeof RequestEnvelopeSchema>;
