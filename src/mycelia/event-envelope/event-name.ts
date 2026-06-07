import { z } from "zod";

const MAX_EVENT_NAME_LENGTH = 120;
const CANONICAL_EVENT_NAME_PATTERN =
  /^[A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*){1,5}$/;
const UNSAFE_EVENT_NAME_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|password|private[_-]?key|raw|secret|token)/i;

export const EventNameSchema = z
  .string()
  .min(1, "event_name is required.")
  .max(
    MAX_EVENT_NAME_LENGTH,
    `event_name must not exceed ${MAX_EVENT_NAME_LENGTH} characters.`,
  )
  .refine(
    (value) => CANONICAL_EVENT_NAME_PATTERN.test(value),
    "event_name must use canonical dotted form.",
  )
  .refine(
    (value) => !UNSAFE_EVENT_NAME_PATTERN.test(value),
    "event_name must not contain sensitive or identifying content.",
  );

export type EventName = z.infer<typeof EventNameSchema>;
