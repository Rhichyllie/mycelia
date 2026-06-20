import { z } from "zod";

import { CausationIdSchema, EventIdSchema } from "../../foundation/shared-kernel";

export const EventOrderingScopes = [
  "TENANT",
  "WORKFLOW",
  "RUN",
  "STEP",
  "TOOL_INVOCATION",
  "POLICY_DECISION",
  "MEMORY_OBJECT",
  "EXTERNAL_INTEGRATION",
] as const;

export type EventOrderingScope = (typeof EventOrderingScopes)[number];

export const EventOrderingScopeSchema = z.enum(EventOrderingScopes);

const UNSAFE_ORDERING_KEY_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|password|private[_-]?key|raw|secret|token|\s)/i;

export const EventOrderingKeySchema = z
  .string()
  .min(1, "ordering_key must be a non-empty opaque string.")
  .max(160, "ordering_key must not exceed 160 characters.")
  .refine(
    (value) => !UNSAFE_ORDERING_KEY_PATTERN.test(value),
    "ordering_key must be opaque and safe.",
  );

export type EventOrderingKey = z.infer<typeof EventOrderingKeySchema>;

export const EventOrderingSchema = z
  .object({
    ordering_scope: EventOrderingScopeSchema,
    ordering_key: EventOrderingKeySchema,
    sequence_number: z.number().int().positive().optional(),
  })
  .strict();

export type EventOrdering = z.infer<typeof EventOrderingSchema>;

export const EventCausalitySchema = z
  .object({
    causation_id: CausationIdSchema.optional(),
    parent_event_id: EventIdSchema.optional(),
    sequence_number: z.number().int().positive().optional(),
  })
  .strict();

export type EventCausality = z.infer<typeof EventCausalitySchema>;
