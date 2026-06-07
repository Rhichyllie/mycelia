import { z } from "zod";

import {
  ActorIdSchema,
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
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
import { RequestOriginSchema } from "../runtime-identity";

import { PolicyActionSchema } from "./policy-action";
import { PolicyPurposeSchema, SafePolicyMetadataSchema } from "./policy-purpose";
import { PolicyResourceDescriptorSchema } from "./policy-resource";

const MAX_POLICY_OPAQUE_ID_LENGTH = 160;

export const PolicyDecisionRequestIdSchema = z
  .string()
  .min(1, "decision_request_id is required.")
  .max(
    MAX_POLICY_OPAQUE_ID_LENGTH,
    `decision_request_id must not exceed ${MAX_POLICY_OPAQUE_ID_LENGTH} characters.`,
  )
  .refine(
    (value) => !/[\s@]/u.test(value),
    "decision_request_id must be an opaque safe string.",
  );

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

export const PolicyDecisionRequestSchema = z
  .object({
    decision_request_id: PolicyDecisionRequestIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    action: PolicyActionSchema,
    resource: PolicyResourceDescriptorSchema,
    runtime_identity_id: RuntimeIdentityIdSchema,
    actor_id: ActorIdSchema.optional(),
    origin: RequestOriginSchema,
    declared_purpose: PolicyPurposeSchema,
    data_classification: DataClassificationSchema,
    created_at: z
      .string()
      .refine(isIsoDateTime, "created_at must be an ISO datetime string."),
    correlation_id: CorrelationIdSchema.optional(),
    causation_id: CausationIdSchema.optional(),
    source_request_id: RequestIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    organizational_scope: OrganizationalScopeSchema.optional(),
    metadata: SafePolicyMetadataSchema.optional(),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.project_id !== undefined && request.workspace_id === undefined) {
      context.addIssue({
        code: "custom",
        message: "project_id requires workspace_id.",
        path: ["project_id"],
      });
    }

    if (request.resource.tenant_id !== request.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "resource tenant_id must match request tenant_id.",
        path: ["resource", "tenant_id"],
      });
    }

    if (
      request.resource.scope !== "TENANT" &&
      request.resource.workspace_id !== request.workspace_id
    ) {
      context.addIssue({
        code: "custom",
        message: "resource workspace_id must match request workspace_id.",
        path: ["resource", "workspace_id"],
      });
    }

    if (
      request.resource.scope === "PROJECT" &&
      request.resource.project_id !== request.project_id
    ) {
      context.addIssue({
        code: "custom",
        message: "resource project_id must match request project_id.",
        path: ["resource", "project_id"],
      });
    }

    if (request.organizational_scope !== undefined) {
      if (request.organizational_scope.tenant_id !== request.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "organizational_scope tenant_id must match request tenant_id.",
          path: ["organizational_scope", "tenant_id"],
        });
      }

      if (request.organizational_scope.workspace_id !== request.workspace_id) {
        context.addIssue({
          code: "custom",
          message:
            "organizational_scope workspace_id must match request workspace_id.",
          path: ["organizational_scope", "workspace_id"],
        });
      }

      if (request.organizational_scope.project_id !== request.project_id) {
        context.addIssue({
          code: "custom",
          message:
            "organizational_scope project_id must match request project_id.",
          path: ["organizational_scope", "project_id"],
        });
      }
    }
  })
  .transform((request) => ({
    ...request,
    organizational_scope:
      request.organizational_scope ?? deriveOrganizationalScope(request),
  }));

export type PolicyDecisionRequest = z.infer<
  typeof PolicyDecisionRequestSchema
>;
export type PolicyDecisionRequestInput = z.input<
  typeof PolicyDecisionRequestSchema
>;
