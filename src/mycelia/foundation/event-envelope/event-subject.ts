import { z } from "zod";

import {
  ProjectIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../../foundation/shared-kernel";

const MAX_SUBJECT_FIELD_LENGTH = 160;
const SUBJECT_TYPE_PATTERN = /^[A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*){0,4}$/;
const UNSAFE_SUBJECT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|password|private[_-]?key|raw|secret|token|\s)/i;

export const EventSubjectTypeSchema = z
  .string()
  .min(1, "subject_type is required.")
  .max(
    MAX_SUBJECT_FIELD_LENGTH,
    `subject_type must not exceed ${MAX_SUBJECT_FIELD_LENGTH} characters.`,
  )
  .refine(
    (value) => SUBJECT_TYPE_PATTERN.test(value),
    "subject_type must use a safe opaque canonical form.",
  )
  .refine(
    (value) => !UNSAFE_SUBJECT_PATTERN.test(value),
    "subject_type must not contain sensitive or identifying content.",
  );

export const EventSubjectIdSchema = z
  .string()
  .min(1, "subject_id is required.")
  .max(
    MAX_SUBJECT_FIELD_LENGTH,
    `subject_id must not exceed ${MAX_SUBJECT_FIELD_LENGTH} characters.`,
  )
  .refine(
    (value) => value.trim() === value,
    "subject_id must not contain leading or trailing whitespace.",
  )
  .refine(
    (value) => !UNSAFE_SUBJECT_PATTERN.test(value),
    "subject_id must be opaque and must not contain sensitive or identifying content.",
  );

export const EventSubjectSchema = z
  .object({
    subject_type: EventSubjectTypeSchema,
    subject_id: EventSubjectIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
  })
  .strict()
  .refine(
    (subject) =>
      subject.workspace_id !== undefined || subject.project_id === undefined,
    "project_id requires workspace_id.",
  );

export type EventSubject = z.infer<typeof EventSubjectSchema>;
