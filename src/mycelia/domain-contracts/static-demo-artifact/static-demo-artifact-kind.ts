import { z } from "zod";

export const StaticDemoArtifactKinds = [
  "EXECUTIVE_WALKTHROUGH",
  "TECHNICAL_TRACE",
  "GOVERNANCE_REVIEW",
  "AUDIT_REPLAY_OVERVIEW",
  "READINESS_SUMMARY",
] as const;

export type StaticDemoArtifactKind =
  (typeof StaticDemoArtifactKinds)[number];

export const StaticDemoArtifactKindSchema = z.enum(
  StaticDemoArtifactKinds,
);
