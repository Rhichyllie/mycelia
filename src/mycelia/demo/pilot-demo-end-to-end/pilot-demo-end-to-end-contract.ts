import { z } from "zod";

import {
  DemoScenarioSeedAllowedRoutes,
  DemoScenarioSeedStepKinds,
  type DemoScenarioSeedAllowedRoute,
  type DemoScenarioSeedStepKind,
  type DemoScenarioSeedWarning,
} from "../../demo/demo-scenario-seed-package";

export const PILOT_DEMO_END_TO_END_PHASE = "3K";

export const PILOT_DEMO_END_TO_END_NAME = "Pilot Demo End-to-End";

export const PILOT_DEMO_END_TO_END_STATUS =
  "controlled non-executing pilot demo walkthrough";

export const PilotDemoEndToEndStatuses = [
  "PILOT_DEMO_READY",
  "PILOT_DEMO_INCOMPLETE",
  "PILOT_DEMO_BLOCKED",
  "PILOT_DEMO_FAILED_SAFE",
] as const;

export type PilotDemoEndToEndStatus =
  (typeof PilotDemoEndToEndStatuses)[number];

export const PilotDemoEndToEndRequiredFields = [
  "pilotDemoId",
  "selectedScenarioId",
  "demoTitle",
  "targetAudience",
  "demoThesis",
  "scenarioSummary",
  "stepCards",
  "routeLinks",
  "expectedGovernancePath",
  "safetyBoundary",
  "demoReadiness",
  "presenterScript",
  "nextActions",
] as const;

export type PilotDemoEndToEndRequiredField =
  (typeof PilotDemoEndToEndRequiredFields)[number];

export type PilotDemoStepCard = {
  readonly stepKind: DemoScenarioSeedStepKind | string;
  readonly title: string;
  readonly safeSummary: string;
  readonly routePath: DemoScenarioSeedAllowedRoute | string;
  readonly status: PilotDemoEndToEndStatus;
  readonly expectedOutcome: string;
  readonly whatToSay: string;
  readonly whatNotToClaim: string;
};

export type PilotDemoRouteLink = {
  readonly label: string;
  readonly routePath: DemoScenarioSeedAllowedRoute;
  readonly safeSummary: string;
};

export type PilotDemoPresenterScriptItem = {
  readonly stepKind: DemoScenarioSeedStepKind;
  readonly whatToSay: string;
  readonly whatNotToClaim: string;
};

export type PilotDemoEndToEndModel = {
  readonly phase: typeof PILOT_DEMO_END_TO_END_PHASE;
  readonly name: typeof PILOT_DEMO_END_TO_END_NAME;
  readonly status: PilotDemoEndToEndStatus;
  readonly requiredFields: readonly PilotDemoEndToEndRequiredField[];
  readonly pilotDemoId: string;
  readonly selectedScenarioId: string;
  readonly demoTitle: string;
  readonly targetAudience: string;
  readonly demoThesis: string;
  readonly scenarioSummary: string;
  readonly stepCards: readonly PilotDemoStepCard[];
  readonly routeLinks: readonly PilotDemoRouteLink[];
  readonly expectedGovernancePath: readonly string[];
  readonly safetyBoundary: readonly string[];
  readonly demoReadiness: {
    readonly status: PilotDemoEndToEndStatus;
    readonly missingPieces: readonly string[];
    readonly warnings: readonly DemoScenarioSeedWarning[];
  };
  readonly presenterScript: readonly PilotDemoPresenterScriptItem[];
  readonly nextActions: readonly string[];
};

const PilotDemoSafeTextSchema = z.string().min(1).max(240);
const PilotDemoSafeSummarySchema = z.string().min(1).max(720);

export const PilotDemoStepCardSchema = z
  .object({
    stepKind: PilotDemoSafeTextSchema,
    title: PilotDemoSafeTextSchema,
    safeSummary: PilotDemoSafeSummarySchema,
    routePath: PilotDemoSafeTextSchema,
    status: z.enum(PilotDemoEndToEndStatuses),
    expectedOutcome: PilotDemoSafeSummarySchema,
    whatToSay: PilotDemoSafeSummarySchema,
    whatNotToClaim: PilotDemoSafeSummarySchema,
  })
  .strict();

export const PilotDemoEndToEndModelSchema = z
  .object({
    phase: z.literal(PILOT_DEMO_END_TO_END_PHASE),
    name: z.literal(PILOT_DEMO_END_TO_END_NAME),
    status: z.enum(PilotDemoEndToEndStatuses),
    requiredFields: z.array(z.enum(PilotDemoEndToEndRequiredFields)),
    pilotDemoId: PilotDemoSafeTextSchema,
    selectedScenarioId: PilotDemoSafeTextSchema,
    demoTitle: PilotDemoSafeTextSchema,
    targetAudience: PilotDemoSafeSummarySchema,
    demoThesis: PilotDemoSafeSummarySchema,
    scenarioSummary: PilotDemoSafeSummarySchema,
    stepCards: z.array(PilotDemoStepCardSchema),
    routeLinks: z.array(
      z
        .object({
          label: PilotDemoSafeTextSchema,
          routePath: z.enum(DemoScenarioSeedAllowedRoutes),
          safeSummary: PilotDemoSafeSummarySchema,
        })
        .strict(),
    ),
    expectedGovernancePath: z.array(PilotDemoSafeSummarySchema),
    safetyBoundary: z.array(PilotDemoSafeSummarySchema),
    demoReadiness: z
      .object({
        status: z.enum(PilotDemoEndToEndStatuses),
        missingPieces: z.array(PilotDemoSafeTextSchema),
        warnings: z.array(
          z
            .object({
              code: PilotDemoSafeTextSchema,
              severity: z.enum(["INFO", "WARNING", "BLOCKER"]),
              safeSummary: PilotDemoSafeSummarySchema,
            })
            .strict(),
        ),
      })
      .strict(),
    presenterScript: z.array(
      z
        .object({
          stepKind: z.enum(DemoScenarioSeedStepKinds),
          whatToSay: PilotDemoSafeSummarySchema,
          whatNotToClaim: PilotDemoSafeSummarySchema,
        })
        .strict(),
    ),
    nextActions: z.array(PilotDemoSafeSummarySchema),
  })
  .strict();
