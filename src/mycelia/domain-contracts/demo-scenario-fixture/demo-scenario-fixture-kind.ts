import { z } from "zod";

export const DemoScenarioFixtureKinds = [
  "GOVERNED_OPERATION_HAPPY_PATH_FIXTURE",
  "POLICY_DENIAL_FIXTURE",
  "APPROVAL_REQUIRED_FIXTURE",
  "AUDIT_INVESTIGATION_FIXTURE",
  "REPLAY_PLANNING_FIXTURE",
] as const;

export type DemoScenarioFixtureKind =
  (typeof DemoScenarioFixtureKinds)[number];

export const DemoScenarioFixtureKindSchema = z.enum(
  DemoScenarioFixtureKinds,
);
