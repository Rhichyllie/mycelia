import { z } from "zod";

import {
  CorrelationIdSchema,
  EventIdSchema,
  ProjectIdSchema,
  RequestIdSchema,
  RunIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../shared-kernel";

import {
  AuditOpaqueReferenceSchema,
  SafeAuditMetadataSchema,
} from "./audit-evidence-ref";

export const AuditSubjectTypes = [
  "REQUEST",
  "POLICY_DECISION",
  "RUNTIME_ENVELOPE",
  "RUNTIME_ADMISSION",
  "GOVERNED_RUN",
  "RUNTIME_STATE",
  "STATE_TRANSITION",
  "STATE_TRANSITION_COORDINATION",
  "EVENT",
  "TENANT_BOUNDARY",
  "SECURITY_BOUNDARY",
] as const;

export type AuditSubjectType = (typeof AuditSubjectTypes)[number];

export const AuditSubjectTypeSchema = z.enum(AuditSubjectTypes);

export const AuditSubjectRefSchema = z
  .object({
    subject_type: AuditSubjectTypeSchema,
    subject_ref_id: AuditOpaqueReferenceSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    run_id: RunIdSchema.optional(),
    request_id: RequestIdSchema.optional(),
    event_id: EventIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .refine(
    (subject) =>
      subject.project_id === undefined || subject.workspace_id !== undefined,
    "project_id requires workspace_id.",
  );

export type AuditSubjectRef = z.infer<typeof AuditSubjectRefSchema>;
export type AuditSubjectRefInput = z.input<typeof AuditSubjectRefSchema>;
