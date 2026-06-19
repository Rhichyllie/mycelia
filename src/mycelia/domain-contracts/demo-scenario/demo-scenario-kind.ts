import { z } from "zod";

export const DemoScenarioKinds = [
  "GOVERNED_OPERATION_HAPPY_PATH",
  "POLICY_DENIAL_PATH",
  "APPROVAL_REQUIRED_PATH",
  "STATE_TRANSITION_PATH",
  "AUDIT_INVESTIGATION_PATH",
  "REPLAY_PLANNING_PATH",
] as const;

export type DemoScenarioKind = (typeof DemoScenarioKinds)[number];

export const DemoScenarioKindSchema = z.enum(DemoScenarioKinds);
