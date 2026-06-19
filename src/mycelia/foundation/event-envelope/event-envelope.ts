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
} from "../../foundation/shared-kernel";
import {
  OrganizationalScopeSchema,
  type OrganizationalScope,
} from "../../foundation/tenancy-boundaries";
import { RequestOriginSchema } from "../../foundation/runtime-identity";

import { EventModeSchema } from "./event-mode";
import { EventNameSchema } from "./event-name";
import { EventOrderingSchema } from "./event-ordering";
import {
  EventPayloadDescriptorSchema,
  SafeEventMetadataSchema,
} from "./event-payload";
import { EventSubjectSchema } from "./event-subject";

const EventSchemaVersionSchema = z
  .string()
  .min(1, "event_schema_version is required.")
  .max(40, "event_schema_version must not exceed 40 characters.")
  .regex(/^\d+\.\d+\.\d+$/, "event_schema_version must use semver form.");

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

export const EventEnvelopeSchema = z
  .object({
    event_id: EventIdSchema,
    event_name: EventNameSchema,
    event_schema_version: EventSchemaVersionSchema,
    event_mode: EventModeSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    subject: EventSubjectSchema,
    request_id: RequestIdSchema.optional(),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    parent_event_id: EventIdSchema.optional(),
    runtime_identity_id: RuntimeIdentityIdSchema,
    actor_id: ActorIdSchema.optional(),
    origin: RequestOriginSchema,
    purpose: z
      .string()
      .min(1, "purpose is required.")
      .max(512, "purpose must not exceed 512 characters."),
    data_classification: DataClassificationSchema,
    occurred_at: z
      .string()
      .refine(isIsoDateTime, "occurred_at must be an ISO datetime string."),
    recorded_at: z
      .string()
      .refine(isIsoDateTime, "recorded_at must be an ISO datetime string."),
    ordering: EventOrderingSchema.optional(),
    payload: EventPayloadDescriptorSchema.optional(),
    metadata: SafeEventMetadataSchema.optional(),
    organizational_scope: OrganizationalScopeSchema.optional(),
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

    if (envelope.subject.tenant_id !== envelope.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "subject tenant_id must match envelope tenant_id.",
        path: ["subject", "tenant_id"],
      });
    }

    if (
      envelope.subject.workspace_id !== undefined &&
      envelope.workspace_id !== undefined &&
      envelope.subject.workspace_id !== envelope.workspace_id
    ) {
      context.addIssue({
        code: "custom",
        message: "subject workspace_id must match envelope workspace_id.",
        path: ["subject", "workspace_id"],
      });
    }

    if (
      envelope.subject.project_id !== undefined &&
      envelope.project_id !== undefined &&
      envelope.subject.project_id !== envelope.project_id
    ) {
      context.addIssue({
        code: "custom",
        message: "subject project_id must match envelope project_id.",
        path: ["subject", "project_id"],
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

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
export type EventEnvelopeInput = z.input<typeof EventEnvelopeSchema>;
