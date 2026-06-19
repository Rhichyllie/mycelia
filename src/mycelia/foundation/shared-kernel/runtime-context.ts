import { z } from "zod";

import { DataClassificationSchema } from "./classification";
import {
  ActorIdSchema,
  CausationIdSchema,
  CorrelationIdSchema,
  ProjectIdSchema,
  RuntimeIdentityIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "./ids";

export const OrganizationalRuntimeContextSchema = z
  .object({
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    actor_id: ActorIdSchema.optional(),
    runtime_identity_id: RuntimeIdentityIdSchema,
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    data_classification: DataClassificationSchema,
    purpose: z
      .string()
      .min(1, "purpose is required.")
      .max(512, "purpose must not exceed 512 characters."),
  })
  .strict();

export type OrganizationalRuntimeContext = z.infer<
  typeof OrganizationalRuntimeContextSchema
>;
