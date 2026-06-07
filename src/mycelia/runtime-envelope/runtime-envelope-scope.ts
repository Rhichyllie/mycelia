import { z } from "zod";

import {
  ProjectIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../shared-kernel";

export const RuntimeEnvelopeScopeSchema = z
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

export type RuntimeEnvelopeScope = z.infer<
  typeof RuntimeEnvelopeScopeSchema
>;
