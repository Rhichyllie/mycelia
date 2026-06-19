import { z } from "zod";

export const APPROVAL_DECISION_UI_SURFACE_PHASE = "3I";

export const APPROVAL_DECISION_UI_SURFACE_NAME =
  "Approval Decision UI Surface";

export const APPROVAL_DECISION_UI_SURFACE_STATUS =
  "controlled non-mutating approval decision preview";

export const ApprovalDecisionUiStatuses = [
  "APPROVAL_DECISION_PREVIEW_READY",
  "APPROVAL_DECISION_PREVIEW_INCOMPLETE",
  "APPROVAL_DECISION_PREVIEW_BLOCKED",
  "APPROVAL_DECISION_PREVIEW_FAILED_SAFE",
] as const;

export type ApprovalDecisionUiStatus =
  (typeof ApprovalDecisionUiStatuses)[number];

export const ApprovalDecisionUiSections = [
  "approvalOverview",
  "governanceContext",
  "decisionPreview",
  "expectedRuntimeEffect",
  "safetyBoundary",
  "warnings",
  "nextActions",
] as const;

export type ApprovalDecisionUiSection =
  (typeof ApprovalDecisionUiSections)[number];

export const ApprovalDecisionUiRiskLevels = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "UNKNOWN",
  "UNSAFE",
] as const;

export type ApprovalDecisionUiRiskLevel =
  (typeof ApprovalDecisionUiRiskLevels)[number];

export const ApprovalDecisionUiGovernanceOutcomes = [
  "ADMIT",
  "REQUIRE_APPROVAL",
  "DENY",
  "UNKNOWN",
] as const;

export type ApprovalDecisionUiGovernanceOutcome =
  (typeof ApprovalDecisionUiGovernanceOutcomes)[number];

export const ApprovalDecisionUiApprovalStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "TIMED_OUT",
  "CANCELLED",
  "UNKNOWN",
] as const;

export type ApprovalDecisionUiApprovalStatus =
  (typeof ApprovalDecisionUiApprovalStatuses)[number];

export const ApprovalDecisionUiDecisionOptions = [
  "APPROVE",
  "REJECT",
  "CANCEL",
  "TIMEOUT",
] as const;

export type ApprovalDecisionUiDecisionOption =
  (typeof ApprovalDecisionUiDecisionOptions)[number];

export const ApprovalDecisionUiTenantRunBoundaryStatuses = [
  "MATCHED",
  "MISMATCHED",
  "UNKNOWN",
] as const;

export type ApprovalDecisionUiTenantRunBoundaryStatus =
  (typeof ApprovalDecisionUiTenantRunBoundaryStatuses)[number];

export type ApprovalDecisionUiTone =
  | "neutral"
  | "success"
  | "info"
  | "warning"
  | "critical";

export type ApprovalDecisionUiDisplayValue = {
  readonly label: string;
  readonly value: string;
  readonly state: "present" | "missing" | "blocked" | "failed_safe";
  readonly tone: ApprovalDecisionUiTone;
};

export type ApprovalDecisionUiWarning = {
  readonly code: string;
  readonly severity: "INFO" | "WARNING" | "BLOCKER";
  readonly safeSummary: string;
};

export type ApprovalDecisionUiPreview = {
  readonly approvalDecisionSurfaceId?: string | null;
  readonly tenantRef?: string | null;
  readonly governedRunRef?: string | null;
  readonly approvalRequestRef?: string | null;
  readonly requesterRef?: string | null;
  readonly approverRole?: string | null;
  readonly resourceRef?: string | null;
  readonly requestPurpose?: string | null;
  readonly riskLevel?: ApprovalDecisionUiRiskLevel | null;
  readonly policyOutcome?: ApprovalDecisionUiGovernanceOutcome | null;
  readonly admissionOutcome?: ApprovalDecisionUiGovernanceOutcome | null;
  readonly approvalStatus?: ApprovalDecisionUiApprovalStatus | null;
  readonly whyApprovalRequired?: string | null;
  readonly availableDecisionOptions?: readonly string[];
  readonly selectedDecisionPreview?: string | null;
  readonly decisionReasonPreview?: string | null;
  readonly expectedApprovalStatus?: ApprovalDecisionUiApprovalStatus | null;
  readonly expectedLifecycleResult?: string | null;
  readonly expectedAuditMoment?: string | null;
  readonly expectedInvestigationImpact?: string | null;
  readonly tenantRunBoundaryStatus?:
    | ApprovalDecisionUiTenantRunBoundaryStatus
    | null;
  readonly safeSummary?: string | null;
  readonly safeWarnings?: readonly ApprovalDecisionUiWarning[];
  readonly nextSteps?: readonly string[];
};

export type ApprovalDecisionUiPresentedModel = {
  readonly phase: typeof APPROVAL_DECISION_UI_SURFACE_PHASE;
  readonly name: typeof APPROVAL_DECISION_UI_SURFACE_NAME;
  readonly status: ApprovalDecisionUiStatus;
  readonly sections: readonly ApprovalDecisionUiSection[];
  readonly preview: ApprovalDecisionUiPreview;
  readonly approvalOverview: readonly ApprovalDecisionUiDisplayValue[];
  readonly governanceContext: readonly ApprovalDecisionUiDisplayValue[];
  readonly decisionPreview: readonly ApprovalDecisionUiDisplayValue[];
  readonly expectedRuntimeEffect: readonly ApprovalDecisionUiDisplayValue[];
  readonly safetyBoundary: readonly string[];
  readonly safeDecisionSummary: string;
  readonly warnings: readonly ApprovalDecisionUiWarning[];
  readonly nextActions: readonly string[];
  readonly emptyWarningMessage: string | null;
  readonly emptyNextActionMessage: string | null;
};

const UNSAFE_APPROVAL_DECISION_UI_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|connection[_-]?string|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw|secret|sql|stack|token)/i;

const ApprovalDecisionUiSafeTextSchema = z
  .string()
  .min(1)
  .max(240)
  .refine((value) => value.trim() === value)
  .refine(
    (value) => !UNSAFE_APPROVAL_DECISION_UI_TEXT_PATTERN.test(value),
    "approval decision text must be safe.",
  );

const ApprovalDecisionUiSafeSummarySchema = z
  .string()
  .min(1)
  .max(520)
  .refine(
    (value) => !UNSAFE_APPROVAL_DECISION_UI_TEXT_PATTERN.test(value),
    "approval decision summary must be safe.",
  );

export const ApprovalDecisionUiWarningSchema = z
  .object({
    code: ApprovalDecisionUiSafeTextSchema,
    severity: z.enum(["INFO", "WARNING", "BLOCKER"]),
    safeSummary: ApprovalDecisionUiSafeSummarySchema,
  })
  .strict();

export const ApprovalDecisionUiPreviewSchema = z
  .object({
    approvalDecisionSurfaceId: ApprovalDecisionUiSafeTextSchema
      .nullable()
      .optional(),
    tenantRef: ApprovalDecisionUiSafeTextSchema.nullable().optional(),
    governedRunRef: ApprovalDecisionUiSafeTextSchema.nullable().optional(),
    approvalRequestRef: ApprovalDecisionUiSafeTextSchema.nullable().optional(),
    requesterRef: ApprovalDecisionUiSafeTextSchema.nullable().optional(),
    approverRole: ApprovalDecisionUiSafeTextSchema.nullable().optional(),
    resourceRef: ApprovalDecisionUiSafeTextSchema.nullable().optional(),
    requestPurpose: ApprovalDecisionUiSafeSummarySchema.nullable().optional(),
    riskLevel: z.enum(ApprovalDecisionUiRiskLevels).nullable().optional(),
    policyOutcome: z
      .enum(ApprovalDecisionUiGovernanceOutcomes)
      .nullable()
      .optional(),
    admissionOutcome: z
      .enum(ApprovalDecisionUiGovernanceOutcomes)
      .nullable()
      .optional(),
    approvalStatus: z
      .enum(ApprovalDecisionUiApprovalStatuses)
      .nullable()
      .optional(),
    whyApprovalRequired: ApprovalDecisionUiSafeSummarySchema
      .nullable()
      .optional(),
    availableDecisionOptions: z
      .array(ApprovalDecisionUiSafeTextSchema)
      .max(6)
      .optional(),
    selectedDecisionPreview: ApprovalDecisionUiSafeTextSchema
      .nullable()
      .optional(),
    decisionReasonPreview: ApprovalDecisionUiSafeSummarySchema
      .nullable()
      .optional(),
    expectedApprovalStatus: z
      .enum(ApprovalDecisionUiApprovalStatuses)
      .nullable()
      .optional(),
    expectedLifecycleResult: ApprovalDecisionUiSafeTextSchema
      .nullable()
      .optional(),
    expectedAuditMoment: ApprovalDecisionUiSafeTextSchema.nullable().optional(),
    expectedInvestigationImpact: ApprovalDecisionUiSafeSummarySchema
      .nullable()
      .optional(),
    tenantRunBoundaryStatus: z
      .enum(ApprovalDecisionUiTenantRunBoundaryStatuses)
      .nullable()
      .optional(),
    safeSummary: ApprovalDecisionUiSafeSummarySchema.nullable().optional(),
    safeWarnings: z.array(ApprovalDecisionUiWarningSchema).max(12).optional(),
    nextSteps: z.array(ApprovalDecisionUiSafeSummarySchema).max(8).optional(),
  })
  .strict();

export const ApprovalDecisionUiPresentedModelSchema = z
  .object({
    phase: z.literal(APPROVAL_DECISION_UI_SURFACE_PHASE),
    name: z.literal(APPROVAL_DECISION_UI_SURFACE_NAME),
    status: z.enum(ApprovalDecisionUiStatuses),
    sections: z.array(z.enum(ApprovalDecisionUiSections)),
    preview: ApprovalDecisionUiPreviewSchema,
    approvalOverview: z.array(z.unknown()),
    governanceContext: z.array(z.unknown()),
    decisionPreview: z.array(z.unknown()),
    expectedRuntimeEffect: z.array(z.unknown()),
    safetyBoundary: z.array(ApprovalDecisionUiSafeSummarySchema),
    safeDecisionSummary: ApprovalDecisionUiSafeSummarySchema,
    warnings: z.array(ApprovalDecisionUiWarningSchema),
    nextActions: z.array(ApprovalDecisionUiSafeSummarySchema),
    emptyWarningMessage: z.string().nullable(),
    emptyNextActionMessage: z.string().nullable(),
  })
  .strict();
