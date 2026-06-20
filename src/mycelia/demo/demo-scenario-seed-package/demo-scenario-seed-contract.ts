import { z } from "zod";

export const DEMO_SCENARIO_SEED_PACKAGE_PHASE = "3J";

export const DEMO_SCENARIO_SEED_PACKAGE_NAME =
  "Demo Scenario Seed Package";

export const DEMO_SCENARIO_SEED_PACKAGE_STATUS =
  "controlled deterministic demo scenario seeds";

export const DemoScenarioSeedStatuses = [
  "DEMO_SCENARIO_READY",
  "DEMO_SCENARIO_INCOMPLETE",
  "DEMO_SCENARIO_BLOCKED",
  "DEMO_SCENARIO_FAILED_SAFE",
] as const;

export type DemoScenarioSeedStatus =
  (typeof DemoScenarioSeedStatuses)[number];

export const DemoScenarioSeedStepKinds = [
  "REQUEST_CREATION",
  "POLICY_ADMISSION",
  "APPROVAL_DECISION",
  "AUDIT_EXPECTATION",
  "INVESTIGATION_REVIEW",
] as const;

export type DemoScenarioSeedStepKind =
  (typeof DemoScenarioSeedStepKinds)[number];

export const DemoScenarioSeedAllowedRoutes = [
  "/mycelia/request/new",
  "/mycelia/approval/decision",
  "/mycelia/investigation",
] as const;

export type DemoScenarioSeedAllowedRoute =
  (typeof DemoScenarioSeedAllowedRoutes)[number];

export const DemoScenarioSeedRequiredFields = [
  "demoScenarioId",
  "scenarioName",
  "scenarioPurpose",
  "targetBuyerContext",
  "requestSeed",
  "policyAdmissionExpectation",
  "approvalExpectation",
  "investigationExpectation",
  "auditExpectation",
  "routeSequence",
  "presenterNotes",
  "safetyWarnings",
  "demoReadinessStatus",
  "nextSteps",
] as const;

export type DemoScenarioSeedRequiredField =
  (typeof DemoScenarioSeedRequiredFields)[number];

export type DemoScenarioSeedWarning = {
  readonly code: string;
  readonly severity: "INFO" | "WARNING" | "BLOCKER";
  readonly safeSummary: string;
};

export type DemoScenarioRouteStep = {
  readonly kind?: string | null;
  readonly route?: string | null;
  readonly label?: string | null;
  readonly safeSummary?: string | null;
};

export type DemoScenarioRequestSeed = {
  readonly requestRef?: string | null;
  readonly tenantRef?: string | null;
  readonly requesterRef?: string | null;
  readonly resourceRef?: string | null;
  readonly requestPurpose?: string | null;
  readonly actionType?: string | null;
  readonly riskHint?: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN" | "UNSAFE" | null;
  readonly safeSummary?: string | null;
};

export type DemoScenarioPolicyAdmissionExpectation = {
  readonly riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN" | "UNSAFE" | null;
  readonly policyOutcome?: "ADMIT" | "REQUIRE_APPROVAL" | "DENY" | "UNKNOWN" | null;
  readonly admissionOutcome?:
    | "ADMIT"
    | "REQUIRE_APPROVAL"
    | "DENY"
    | "UNKNOWN"
    | null;
  readonly reasonCode?: string | null;
  readonly lifecycleHint?: string | null;
  readonly safeSummary?: string | null;
};

export type DemoScenarioApprovalExpectation = {
  readonly approvalRequired?: boolean | null;
  readonly approvalPreviewRef?: string | null;
  readonly selectedDecisionPreview?: string | null;
  readonly expectedApprovalStatus?: string | null;
  readonly expectedLifecycleResult?: string | null;
  readonly expectedApprovalRole?: string | null;
  readonly safeSummary?: string | null;
};

export type DemoScenarioInvestigationExpectation = {
  readonly expectedState?: string | null;
  readonly expectedCompleteness?:
    | "COMPLETE"
    | "INCOMPLETE"
    | "BLOCKED"
    | "FAILED_SAFE"
    | null;
  readonly expectedFindings?: readonly string[];
  readonly safeSummary?: string | null;
};

export type DemoScenarioAuditExpectation = {
  readonly expectedMoments?: readonly string[];
  readonly missingMoments?: readonly string[];
  readonly safeSummary?: string | null;
};

export type DemoScenarioSeed = {
  readonly demoScenarioId?: string | null;
  readonly scenarioName?: string | null;
  readonly scenarioPurpose?: string | null;
  readonly targetBuyerContext?: string | null;
  readonly requestSeed?: DemoScenarioRequestSeed | null;
  readonly policyAdmissionExpectation?:
    | DemoScenarioPolicyAdmissionExpectation
    | null;
  readonly approvalExpectation?: DemoScenarioApprovalExpectation | null;
  readonly investigationExpectation?: DemoScenarioInvestigationExpectation | null;
  readonly auditExpectation?: DemoScenarioAuditExpectation | null;
  readonly routeSequence?: readonly DemoScenarioRouteStep[];
  readonly presenterNotes?: readonly string[];
  readonly safetyWarnings?: readonly DemoScenarioSeedWarning[];
  readonly demoReadinessStatus?: DemoScenarioSeedStatus | null;
  readonly nextSteps?: readonly string[];
};

export type DemoScenarioSeedPresentedModel = {
  readonly phase: typeof DEMO_SCENARIO_SEED_PACKAGE_PHASE;
  readonly name: typeof DEMO_SCENARIO_SEED_PACKAGE_NAME;
  readonly status: DemoScenarioSeedStatus;
  readonly requiredFields: readonly DemoScenarioSeedRequiredField[];
  readonly stepKinds: readonly DemoScenarioSeedStepKind[];
  readonly allowedRoutes: readonly DemoScenarioSeedAllowedRoute[];
  readonly scenario: DemoScenarioSeed;
  readonly scenarioSummary: string;
  readonly routeSequence: readonly DemoScenarioRouteStep[];
  readonly requestSeedSummary: string;
  readonly policyAdmissionSummary: string;
  readonly approvalSummary: string;
  readonly auditSummary: string;
  readonly investigationSummary: string;
  readonly presenterNotes: readonly string[];
  readonly safetyWarnings: readonly DemoScenarioSeedWarning[];
  readonly nextSteps: readonly string[];
};

export type DemoScenarioSeedPackage = {
  readonly phase: typeof DEMO_SCENARIO_SEED_PACKAGE_PHASE;
  readonly name: typeof DEMO_SCENARIO_SEED_PACKAGE_NAME;
  readonly status: typeof DEMO_SCENARIO_SEED_PACKAGE_STATUS;
  readonly scenarios: readonly DemoScenarioSeedPresentedModel[];
  readonly allowedRoutes: readonly DemoScenarioSeedAllowedRoute[];
  readonly stepKinds: readonly DemoScenarioSeedStepKind[];
  readonly safetyBoundary: readonly string[];
  readonly safeSummary: string;
};

const UNSAFE_DEMO_SCENARIO_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|connection[_-]?string|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw|secret|sql|stack|token)/i;

const DemoScenarioSafeTextSchema = z
  .string()
  .min(1)
  .max(240)
  .refine((value) => value.trim() === value)
  .refine(
    (value) => !UNSAFE_DEMO_SCENARIO_TEXT_PATTERN.test(value),
    "demo scenario text must be safe.",
  );

const DemoScenarioSafeSummarySchema = z
  .string()
  .min(1)
  .max(640)
  .refine(
    (value) => !UNSAFE_DEMO_SCENARIO_TEXT_PATTERN.test(value),
    "demo scenario summary must be safe.",
  );

export const DemoScenarioSeedWarningSchema = z
  .object({
    code: DemoScenarioSafeTextSchema,
    severity: z.enum(["INFO", "WARNING", "BLOCKER"]),
    safeSummary: DemoScenarioSafeSummarySchema,
  })
  .strict();

export const DemoScenarioRouteStepSchema = z
  .object({
    kind: DemoScenarioSafeTextSchema.nullable().optional(),
    route: DemoScenarioSafeTextSchema.nullable().optional(),
    label: DemoScenarioSafeTextSchema.nullable().optional(),
    safeSummary: DemoScenarioSafeSummarySchema.nullable().optional(),
  })
  .strict();

export const DemoScenarioRequestSeedSchema = z
  .object({
    requestRef: DemoScenarioSafeTextSchema.nullable().optional(),
    tenantRef: DemoScenarioSafeTextSchema.nullable().optional(),
    requesterRef: DemoScenarioSafeTextSchema.nullable().optional(),
    resourceRef: DemoScenarioSafeTextSchema.nullable().optional(),
    requestPurpose: DemoScenarioSafeSummarySchema.nullable().optional(),
    actionType: DemoScenarioSafeTextSchema.nullable().optional(),
    riskHint: z
      .enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN", "UNSAFE"])
      .nullable()
      .optional(),
    safeSummary: DemoScenarioSafeSummarySchema.nullable().optional(),
  })
  .strict();

export const DemoScenarioPolicyAdmissionExpectationSchema = z
  .object({
    riskLevel: z
      .enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN", "UNSAFE"])
      .nullable()
      .optional(),
    policyOutcome: z
      .enum(["ADMIT", "REQUIRE_APPROVAL", "DENY", "UNKNOWN"])
      .nullable()
      .optional(),
    admissionOutcome: z
      .enum(["ADMIT", "REQUIRE_APPROVAL", "DENY", "UNKNOWN"])
      .nullable()
      .optional(),
    reasonCode: DemoScenarioSafeTextSchema.nullable().optional(),
    lifecycleHint: DemoScenarioSafeTextSchema.nullable().optional(),
    safeSummary: DemoScenarioSafeSummarySchema.nullable().optional(),
  })
  .strict();

export const DemoScenarioApprovalExpectationSchema = z
  .object({
    approvalRequired: z.boolean().nullable().optional(),
    approvalPreviewRef: DemoScenarioSafeTextSchema.nullable().optional(),
    selectedDecisionPreview: DemoScenarioSafeTextSchema.nullable().optional(),
    expectedApprovalStatus: DemoScenarioSafeTextSchema.nullable().optional(),
    expectedLifecycleResult: DemoScenarioSafeTextSchema.nullable().optional(),
    expectedApprovalRole: DemoScenarioSafeTextSchema.nullable().optional(),
    safeSummary: DemoScenarioSafeSummarySchema.nullable().optional(),
  })
  .strict();

export const DemoScenarioInvestigationExpectationSchema = z
  .object({
    expectedState: DemoScenarioSafeTextSchema.nullable().optional(),
    expectedCompleteness: z
      .enum(["COMPLETE", "INCOMPLETE", "BLOCKED", "FAILED_SAFE"])
      .nullable()
      .optional(),
    expectedFindings: z.array(DemoScenarioSafeTextSchema).max(12).optional(),
    safeSummary: DemoScenarioSafeSummarySchema.nullable().optional(),
  })
  .strict();

export const DemoScenarioAuditExpectationSchema = z
  .object({
    expectedMoments: z.array(DemoScenarioSafeTextSchema).max(8).optional(),
    missingMoments: z.array(DemoScenarioSafeTextSchema).max(8).optional(),
    safeSummary: DemoScenarioSafeSummarySchema.nullable().optional(),
  })
  .strict();

export const DemoScenarioSeedSchema = z
  .object({
    demoScenarioId: DemoScenarioSafeTextSchema.nullable().optional(),
    scenarioName: DemoScenarioSafeTextSchema.nullable().optional(),
    scenarioPurpose: DemoScenarioSafeSummarySchema.nullable().optional(),
    targetBuyerContext: DemoScenarioSafeSummarySchema.nullable().optional(),
    requestSeed: DemoScenarioRequestSeedSchema.nullable().optional(),
    policyAdmissionExpectation:
      DemoScenarioPolicyAdmissionExpectationSchema.nullable().optional(),
    approvalExpectation: DemoScenarioApprovalExpectationSchema
      .nullable()
      .optional(),
    investigationExpectation: DemoScenarioInvestigationExpectationSchema
      .nullable()
      .optional(),
    auditExpectation: DemoScenarioAuditExpectationSchema.nullable().optional(),
    routeSequence: z.array(DemoScenarioRouteStepSchema).max(8).optional(),
    presenterNotes: z.array(DemoScenarioSafeSummarySchema).max(8).optional(),
    safetyWarnings: z.array(DemoScenarioSeedWarningSchema).max(12).optional(),
    demoReadinessStatus: z.enum(DemoScenarioSeedStatuses).nullable().optional(),
    nextSteps: z.array(DemoScenarioSafeSummarySchema).max(8).optional(),
  })
  .strict();
