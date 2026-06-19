import { z } from "zod";

import {
  ProjectIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../../foundation/shared-kernel";

export const TenantScopeSchema = z
  .object({
    tenant_id: TenantIdSchema,
  })
  .strict();

export type TenantScope = z.infer<typeof TenantScopeSchema>;

export const WorkspaceScopeSchema = z
  .object({
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema,
  })
  .strict();

export type WorkspaceScope = z.infer<typeof WorkspaceScopeSchema>;

export const ProjectScopeSchema = z
  .object({
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema,
    project_id: ProjectIdSchema,
  })
  .strict();

export type ProjectScope = z.infer<typeof ProjectScopeSchema>;

const OrganizationalScopeBaseSchema = z
  .object({
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
  })
  .strict()
  .refine(
    (scope) => scope.workspace_id !== undefined || scope.project_id === undefined,
    "project_id requires workspace_id.",
  );

export const OrganizationalScopeSchema = OrganizationalScopeBaseSchema;

export type OrganizationalScope = z.infer<typeof OrganizationalScopeSchema>;
