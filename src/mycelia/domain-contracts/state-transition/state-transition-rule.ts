import { z } from "zod";

import {
  RuntimeStateKindSchema,
  type RuntimeStateKind,
} from "../../domain-contracts/runtime-state";

export const AllowedStateTransitionRules = [
  { from_kind: "CREATED", to_kind: "ADMITTED" },
  { from_kind: "CREATED", to_kind: "REJECTED" },
  { from_kind: "CREATED", to_kind: "CANCELLED" },
  { from_kind: "ADMITTED", to_kind: "CANCELLED" },
  { from_kind: "REJECTED", to_kind: "CANCELLED" },
] as const;

export const StateTransitionRuleSchema = z
  .object({
    from_kind: RuntimeStateKindSchema,
    to_kind: RuntimeStateKindSchema,
  })
  .strict()
  .refine(
    (rule) => isAllowedStateTransitionRule(rule.from_kind, rule.to_kind),
    "state transition rule is not allowed.",
  );

export type StateTransitionRule = z.infer<typeof StateTransitionRuleSchema>;

export function isAllowedStateTransitionRule(
  fromKind: RuntimeStateKind,
  toKind: RuntimeStateKind,
): boolean {
  return AllowedStateTransitionRules.some(
    (rule) => rule.from_kind === fromKind && rule.to_kind === toKind,
  );
}
