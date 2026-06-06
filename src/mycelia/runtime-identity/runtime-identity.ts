import { z } from "zod";

import {
  ActorIdSchema,
  ProjectIdSchema,
  RuntimeIdentityIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../shared-kernel";

function requireWorkspaceWhenProjectIsPresent(
  scope: { readonly workspace_id?: unknown; readonly project_id?: unknown },
  context: z.RefinementCtx,
) {
  if (scope.project_id !== undefined && scope.workspace_id === undefined) {
    context.addIssue({
      code: "custom",
      message: "project_id requires workspace_id.",
      path: ["project_id"],
    });
  }
}

export const RuntimeIdentitySchema = z
  .object({
    runtime_identity_id: RuntimeIdentityIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
  })
  .strict()
  .superRefine(requireWorkspaceWhenProjectIsPresent);

export type RuntimeIdentity = z.infer<typeof RuntimeIdentitySchema>;

export const HumanActorIdentitySchema = z
  .object({
    actor_id: ActorIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
  })
  .strict()
  .superRefine(requireWorkspaceWhenProjectIsPresent);

export type HumanActorIdentity = z.infer<typeof HumanActorIdentitySchema>;

export const ServiceActorIdentitySchema = z
  .object({
    runtime_identity_id: RuntimeIdentityIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
  })
  .strict()
  .superRefine(requireWorkspaceWhenProjectIsPresent);

export type ServiceActorIdentity = z.infer<typeof ServiceActorIdentitySchema>;

export const RuntimeActorSchema = z.union([
  HumanActorIdentitySchema,
  ServiceActorIdentitySchema,
]);

export type RuntimeActor = z.infer<typeof RuntimeActorSchema>;

export const RuntimeExecutionIdentitySchema = z
  .object({
    runtime_identity_id: RuntimeIdentityIdSchema,
    actor_id: ActorIdSchema.optional(),
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
  })
  .strict()
  .superRefine(requireWorkspaceWhenProjectIsPresent);

export type RuntimeExecutionIdentity = z.infer<
  typeof RuntimeExecutionIdentitySchema
>;
