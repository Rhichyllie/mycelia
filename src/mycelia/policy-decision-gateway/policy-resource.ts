import { z } from "zod";

import {
  ProjectIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../shared-kernel";

export const PolicyResourceScopes = [
  "TENANT",
  "WORKSPACE",
  "PROJECT",
] as const;

export type PolicyResourceScope = (typeof PolicyResourceScopes)[number];

export const PolicyResourceScopeSchema = z.enum(PolicyResourceScopes);

const MAX_POLICY_RESOURCE_FIELD_LENGTH = 160;
const POLICY_RESOURCE_TYPE_PATTERN =
  /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*){0,6}$/;
const UNSAFE_POLICY_RESOURCE_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|display[_-]?name|password|private[_-]?key|raw|secret|tenant[_-]?name|token|[/\\]|\s)/i;

export const PolicyResourceTypeSchema = z
  .string()
  .min(1, "resource_type is required.")
  .max(
    MAX_POLICY_RESOURCE_FIELD_LENGTH,
    `resource_type must not exceed ${MAX_POLICY_RESOURCE_FIELD_LENGTH} characters.`,
  )
  .refine(
    (value) => POLICY_RESOURCE_TYPE_PATTERN.test(value),
    "resource_type must use safe dotted form.",
  )
  .refine(
    (value) => !UNSAFE_POLICY_RESOURCE_PATTERN.test(value),
    "resource_type must not contain unsafe or identifying content.",
  );

export const PolicyResourceIdSchema = z
  .string()
  .min(1, "resource_id must be non-empty when present.")
  .max(
    MAX_POLICY_RESOURCE_FIELD_LENGTH,
    `resource_id must not exceed ${MAX_POLICY_RESOURCE_FIELD_LENGTH} characters.`,
  )
  .refine(
    (value) => value.trim() === value,
    "resource_id must not contain leading or trailing whitespace.",
  )
  .refine(
    (value) => !UNSAFE_POLICY_RESOURCE_PATTERN.test(value),
    "resource_id must be opaque and safe.",
  );

export const PolicyResourceDescriptorSchema = z
  .object({
    resource_type: PolicyResourceTypeSchema,
    resource_id: PolicyResourceIdSchema.optional(),
    scope: PolicyResourceScopeSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
  })
  .strict()
  .superRefine((resource, context) => {
    if (resource.scope === "TENANT") {
      if (resource.workspace_id !== undefined) {
        context.addIssue({
          code: "custom",
          message: "tenant-scoped resources must not include workspace_id.",
          path: ["workspace_id"],
        });
      }
      if (resource.project_id !== undefined) {
        context.addIssue({
          code: "custom",
          message: "tenant-scoped resources must not include project_id.",
          path: ["project_id"],
        });
      }
    }

    if (resource.scope === "WORKSPACE") {
      if (resource.workspace_id === undefined) {
        context.addIssue({
          code: "custom",
          message: "workspace-scoped resources require workspace_id.",
          path: ["workspace_id"],
        });
      }
      if (resource.project_id !== undefined) {
        context.addIssue({
          code: "custom",
          message: "workspace-scoped resources must not include project_id.",
          path: ["project_id"],
        });
      }
    }

    if (resource.scope === "PROJECT") {
      if (resource.workspace_id === undefined) {
        context.addIssue({
          code: "custom",
          message: "project-scoped resources require workspace_id.",
          path: ["workspace_id"],
        });
      }
      if (resource.project_id === undefined) {
        context.addIssue({
          code: "custom",
          message: "project-scoped resources require project_id.",
          path: ["project_id"],
        });
      }
    }
  });

export type PolicyResourceDescriptor = z.infer<
  typeof PolicyResourceDescriptorSchema
>;
