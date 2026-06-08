import { z } from "zod";

import {
  ActorIdSchema,
  CorrelationIdSchema,
  RuntimeIdentityIdSchema,
  TenantIdSchema,
} from "../shared-kernel";

import {
  AuditOpaqueReferenceSchema,
  SafeAuditMetadataSchema,
} from "./audit-evidence-ref";

export const AuditActorTypes = [
  "HUMAN_ACTOR",
  "SERVICE_ACTOR",
  "RUNTIME_ACTOR",
  "SYSTEM",
] as const;

export type AuditActorType = (typeof AuditActorTypes)[number];

export const AuditActorTypeSchema = z.enum(AuditActorTypes);

export const AuditActorRefSchema = z
  .object({
    actor_type: AuditActorTypeSchema,
    actor_ref_id: AuditOpaqueReferenceSchema,
    tenant_id: TenantIdSchema.optional(),
    actor_id: ActorIdSchema.optional(),
    runtime_identity_id: RuntimeIdentityIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict();

export type AuditActorRef = z.infer<typeof AuditActorRefSchema>;
export type AuditActorRefInput = z.input<typeof AuditActorRefSchema>;
