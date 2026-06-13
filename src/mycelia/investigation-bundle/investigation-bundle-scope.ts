import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  EventIdSchema,
  ProjectIdSchema,
  RunIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../shared-kernel";

export const InvestigationBundleScopeSchema = z
  .object({
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
  })
  .strict()
  .refine(
    (scope) =>
      scope.project_id === undefined || scope.workspace_id !== undefined,
    "project_id requires workspace_id.",
  );

export type InvestigationBundleScope = z.infer<
  typeof InvestigationBundleScopeSchema
>;
export type InvestigationBundleScopeInput = z.input<
  typeof InvestigationBundleScopeSchema
>;
