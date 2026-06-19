import { z } from "zod";

const MAX_POLICY_ACTION_LENGTH = 120;
const POLICY_ACTION_PATTERN =
  /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*){1,7}$/;
const UNSAFE_POLICY_ACTION_PATTERN =
  /(^\*$|[*\s/@\\:;$`'"|&<>()[\]{}]|https?:\/\/|www\.|authorization|api[_-]?key|bearer|credential|password|private[_-]?key|raw|secret|shell|sudo|token)/i;

export const PolicyActionSchema = z
  .string()
  .min(1, "policy action is required.")
  .max(
    MAX_POLICY_ACTION_LENGTH,
    `policy action must not exceed ${MAX_POLICY_ACTION_LENGTH} characters.`,
  )
  .refine(
    (value) => POLICY_ACTION_PATTERN.test(value),
    "policy action must use safe dotted form.",
  )
  .refine(
    (value) => !UNSAFE_POLICY_ACTION_PATTERN.test(value),
    "policy action must not contain unsafe or identifying content.",
  );

export type PolicyAction = z.infer<typeof PolicyActionSchema>;
