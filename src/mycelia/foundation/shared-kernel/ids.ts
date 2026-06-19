import { z } from "zod";

declare const idBrand: unique symbol;

export type BrandedId<Name extends string> = string & {
  readonly [idBrand]: Name;
};

export type TenantId = BrandedId<"TenantId">;
export type WorkspaceId = BrandedId<"WorkspaceId">;
export type ProjectId = BrandedId<"ProjectId">;
export type WorkflowId = BrandedId<"WorkflowId">;
export type WorkflowVersionId = BrandedId<"WorkflowVersionId">;
export type RunId = BrandedId<"RunId">;
export type StepId = BrandedId<"StepId">;
export type ActorId = BrandedId<"ActorId">;
export type RuntimeIdentityId = BrandedId<"RuntimeIdentityId">;
export type CorrelationId = BrandedId<"CorrelationId">;
export type CausationId = BrandedId<"CausationId">;
export type RequestId = BrandedId<"RequestId">;
export type EventId = BrandedId<"EventId">;
export type PolicySnapshotId = BrandedId<"PolicySnapshotId">;
export type ContextSnapshotId = BrandedId<"ContextSnapshotId">;
export type BoundarySnapshotId = BrandedId<"BoundarySnapshotId">;
export type SecuritySnapshotId = BrandedId<"SecuritySnapshotId">;
export type ToolInvocationId = BrandedId<"ToolInvocationId">;
export type CredentialReferenceId = BrandedId<"CredentialReferenceId">;
export type IdempotencyKey = BrandedId<"IdempotencyKey">;

const MAX_OPAQUE_ID_LENGTH = 160;
const CONTROL_OR_WHITESPACE_PATTERN = /[\s\p{Cc}]/u;

function createOpaqueIdSchema<Name extends string>(label: Name) {
  return z
    .string()
    .min(1, `${label} must be a non-empty opaque string.`)
    .max(
      MAX_OPAQUE_ID_LENGTH,
      `${label} must not exceed ${MAX_OPAQUE_ID_LENGTH} characters.`,
    )
    .refine(
      (value) => value.trim() === value,
      `${label} must not contain leading or trailing whitespace.`,
    )
    .refine(
      (value) => !CONTROL_OR_WHITESPACE_PATTERN.test(value),
      `${label} must not contain whitespace or control characters.`,
    )
    .refine(
      (value) => !value.includes("@"),
      `${label} must not contain email-like or human-identifying content.`,
    )
    .transform((value) => value as BrandedId<Name>);
}

export const TenantIdSchema = createOpaqueIdSchema("TenantId");
export const WorkspaceIdSchema = createOpaqueIdSchema("WorkspaceId");
export const ProjectIdSchema = createOpaqueIdSchema("ProjectId");
export const WorkflowIdSchema = createOpaqueIdSchema("WorkflowId");
export const WorkflowVersionIdSchema =
  createOpaqueIdSchema("WorkflowVersionId");
export const RunIdSchema = createOpaqueIdSchema("RunId");
export const StepIdSchema = createOpaqueIdSchema("StepId");
export const ActorIdSchema = createOpaqueIdSchema("ActorId");
export const RuntimeIdentityIdSchema =
  createOpaqueIdSchema("RuntimeIdentityId");
export const CorrelationIdSchema = createOpaqueIdSchema("CorrelationId");
export const CausationIdSchema = createOpaqueIdSchema("CausationId");
export const RequestIdSchema = createOpaqueIdSchema("RequestId");
export const EventIdSchema = createOpaqueIdSchema("EventId");
export const PolicySnapshotIdSchema = createOpaqueIdSchema("PolicySnapshotId");
export const ContextSnapshotIdSchema =
  createOpaqueIdSchema("ContextSnapshotId");
export const BoundarySnapshotIdSchema =
  createOpaqueIdSchema("BoundarySnapshotId");
export const SecuritySnapshotIdSchema =
  createOpaqueIdSchema("SecuritySnapshotId");
export const ToolInvocationIdSchema =
  createOpaqueIdSchema("ToolInvocationId");
export const CredentialReferenceIdSchema = createOpaqueIdSchema(
  "CredentialReferenceId",
);
export const IdempotencyKeySchema = createOpaqueIdSchema("IdempotencyKey");

export const CanonicalIdSchemas = {
  TenantId: TenantIdSchema,
  WorkspaceId: WorkspaceIdSchema,
  ProjectId: ProjectIdSchema,
  WorkflowId: WorkflowIdSchema,
  WorkflowVersionId: WorkflowVersionIdSchema,
  RunId: RunIdSchema,
  StepId: StepIdSchema,
  ActorId: ActorIdSchema,
  RuntimeIdentityId: RuntimeIdentityIdSchema,
  CorrelationId: CorrelationIdSchema,
  CausationId: CausationIdSchema,
  RequestId: RequestIdSchema,
  EventId: EventIdSchema,
  PolicySnapshotId: PolicySnapshotIdSchema,
  ContextSnapshotId: ContextSnapshotIdSchema,
  BoundarySnapshotId: BoundarySnapshotIdSchema,
  SecuritySnapshotId: SecuritySnapshotIdSchema,
  ToolInvocationId: ToolInvocationIdSchema,
  CredentialReferenceId: CredentialReferenceIdSchema,
  IdempotencyKey: IdempotencyKeySchema,
} as const;
