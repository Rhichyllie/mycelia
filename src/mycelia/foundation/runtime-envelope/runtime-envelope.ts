import { z } from "zod";

import { TenantIdSchema } from "../../foundation/shared-kernel";

import {
  RuntimeEnvelopeContextSchema,
  RuntimeEnvelopeOpaqueReferenceSchema,
} from "./runtime-envelope-context";
import { RuntimeEnvelopeScopeSchema } from "./runtime-envelope-scope";

export const RuntimeEnvelopeIdSchema = RuntimeEnvelopeOpaqueReferenceSchema;

export type RuntimeEnvelopeId = z.infer<typeof RuntimeEnvelopeIdSchema>;

export const RuntimeEnvelopeSchema = RuntimeEnvelopeContextSchema.extend({
  envelope_id: RuntimeEnvelopeIdSchema,
  tenant_id: TenantIdSchema,
  scope: RuntimeEnvelopeScopeSchema,
})
  .strict()
  .superRefine((envelope, context) => {
    if (envelope.scope.tenant_id !== envelope.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "scope tenant_id must match envelope tenant_id.",
        path: ["scope", "tenant_id"],
      });
    }

    if (envelope.runtime_identity.tenant_id !== envelope.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "runtime identity tenant_id must match envelope tenant_id.",
        path: ["runtime_identity", "tenant_id"],
      });
    }

    if (
      envelope.runtime_identity.workspace_id !== undefined &&
      envelope.scope.workspace_id !== undefined &&
      envelope.runtime_identity.workspace_id !== envelope.scope.workspace_id
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime identity workspace_id must match envelope scope.",
        path: ["runtime_identity", "workspace_id"],
      });
    }

    if (
      envelope.runtime_identity.project_id !== undefined &&
      envelope.scope.project_id !== undefined &&
      envelope.runtime_identity.project_id !== envelope.scope.project_id
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime identity project_id must match envelope scope.",
        path: ["runtime_identity", "project_id"],
      });
    }

    if (
      envelope.actor !== undefined &&
      envelope.actor.tenant_id !== envelope.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "actor tenant_id must match envelope tenant_id.",
        path: ["actor", "tenant_id"],
      });
    }

    if (
      envelope.actor !== undefined &&
      envelope.actor.workspace_id !== undefined &&
      envelope.scope.workspace_id !== undefined &&
      envelope.actor.workspace_id !== envelope.scope.workspace_id
    ) {
      context.addIssue({
        code: "custom",
        message: "actor workspace_id must match envelope scope.",
        path: ["actor", "workspace_id"],
      });
    }

    if (
      envelope.actor !== undefined &&
      envelope.actor.project_id !== undefined &&
      envelope.scope.project_id !== undefined &&
      envelope.actor.project_id !== envelope.scope.project_id
    ) {
      context.addIssue({
        code: "custom",
        message: "actor project_id must match envelope scope.",
        path: ["actor", "project_id"],
      });
    }
  });

export type RuntimeEnvelope = z.infer<typeof RuntimeEnvelopeSchema>;
export type RuntimeEnvelopeInput = z.input<typeof RuntimeEnvelopeSchema>;
