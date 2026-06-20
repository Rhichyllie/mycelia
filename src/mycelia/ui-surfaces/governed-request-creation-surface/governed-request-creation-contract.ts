import { z } from "zod";

export const GOVERNED_REQUEST_CREATION_SURFACE_PHASE = "3H";

export const GOVERNED_REQUEST_CREATION_SURFACE_NAME =
  "Governed Request Creation Surface";

export const GOVERNED_REQUEST_CREATION_SURFACE_STATUS =
  "controlled non-mutating request draft preview";

export const GovernedRequestCreationStatuses = [
  "REQUEST_DRAFT_READY",
  "REQUEST_DRAFT_INCOMPLETE",
  "REQUEST_DRAFT_BLOCKED",
  "REQUEST_DRAFT_FAILED_SAFE",
] as const;

export type GovernedRequestCreationStatus =
  (typeof GovernedRequestCreationStatuses)[number];

export const GovernedRequestCreationSections = [
  "requestOverview",
  "governancePreview",
  "safetyBoundary",
  "expectedRunPath",
  "requestSeedSummary",
  "warnings",
  "nextActions",
] as const;

export type GovernedRequestCreationSection =
  (typeof GovernedRequestCreationSections)[number];

export const GovernedRequestCreationSupportedActionTypes = [
  "DOCUMENT_REVIEW",
  "COMPLIANCE_REVIEW",
  "DOCUMENT_APPROVAL_REVIEW",
] as const;

export type GovernedRequestCreationSupportedActionType =
  (typeof GovernedRequestCreationSupportedActionTypes)[number];

export const GovernedRequestCreationRequestModes = [
  "CONTROLLED_DRAFT",
  "DEMO_SEED_PREVIEW",
] as const;

export type GovernedRequestCreationRequestMode =
  (typeof GovernedRequestCreationRequestModes)[number];

export const GovernedRequestCreationRiskHints = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "UNKNOWN",
  "UNSAFE",
] as const;

export type GovernedRequestCreationRiskHint =
  (typeof GovernedRequestCreationRiskHints)[number];

export const GovernedRequestCreationExpectedOutcomes = [
  "ADMIT",
  "REQUIRE_APPROVAL",
  "DENY",
  "UNKNOWN",
] as const;

export type GovernedRequestCreationExpectedOutcome =
  (typeof GovernedRequestCreationExpectedOutcomes)[number];

export type GovernedRequestCreationTone =
  | "neutral"
  | "success"
  | "info"
  | "warning"
  | "critical";

export type GovernedRequestCreationDisplayValue = {
  readonly label: string;
  readonly value: string;
  readonly state: "present" | "missing" | "blocked" | "failed_safe";
  readonly tone: GovernedRequestCreationTone;
};

export type GovernedRequestCreationWarning = {
  readonly code: string;
  readonly severity: "INFO" | "WARNING" | "BLOCKER";
  readonly safeSummary: string;
};

export type GovernedRequestCreationDraft = {
  readonly draftRef?: string | null;
  readonly tenantRef?: string | null;
  readonly requesterRef?: string | null;
  readonly resourceRef?: string | null;
  readonly requestPurpose?: string | null;
  readonly actionType?: string | null;
  readonly requestMode?: GovernedRequestCreationRequestMode | null;
  readonly riskHint?: GovernedRequestCreationRiskHint | null;
  readonly expectedPolicyOutcome?: GovernedRequestCreationExpectedOutcome | null;
  readonly expectedAdmissionOutcome?:
    | GovernedRequestCreationExpectedOutcome
    | null;
  readonly approvalExpected?: boolean | null;
  readonly expectedApprovalRole?: string | null;
  readonly expectedInvestigationSections?: readonly string[];
  readonly safeSummary?: string | null;
  readonly safeWarnings?: readonly GovernedRequestCreationWarning[];
  readonly nextSteps?: readonly string[];
};

export type GovernedRequestCreationPresentedModel = {
  readonly phase: typeof GOVERNED_REQUEST_CREATION_SURFACE_PHASE;
  readonly name: typeof GOVERNED_REQUEST_CREATION_SURFACE_NAME;
  readonly status: GovernedRequestCreationStatus;
  readonly sections: readonly GovernedRequestCreationSection[];
  readonly draft: GovernedRequestCreationDraft;
  readonly requestOverview: readonly GovernedRequestCreationDisplayValue[];
  readonly governancePreview: readonly GovernedRequestCreationDisplayValue[];
  readonly safetyBoundary: readonly string[];
  readonly expectedRunPath: readonly string[];
  readonly requestSeedSummary: string;
  readonly warnings: readonly GovernedRequestCreationWarning[];
  readonly nextActions: readonly string[];
  readonly emptyWarningMessage: string | null;
  readonly emptyNextActionMessage: string | null;
};

const UNSAFE_REQUEST_CREATION_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|connection[_-]?string|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw|secret|sql|stack|token)/i;

const GovernedRequestCreationSafeTextSchema = z
  .string()
  .min(1)
  .max(240)
  .refine((value) => value.trim() === value)
  .refine(
    (value) => !UNSAFE_REQUEST_CREATION_TEXT_PATTERN.test(value),
    "request creation text must be safe.",
  );

const GovernedRequestCreationSafeSummarySchema = z
  .string()
  .min(1)
  .max(480)
  .refine(
    (value) => !UNSAFE_REQUEST_CREATION_TEXT_PATTERN.test(value),
    "request creation summary must be safe.",
  );

export const GovernedRequestCreationWarningSchema = z
  .object({
    code: GovernedRequestCreationSafeTextSchema,
    severity: z.enum(["INFO", "WARNING", "BLOCKER"]),
    safeSummary: GovernedRequestCreationSafeSummarySchema,
  })
  .strict();

export const GovernedRequestCreationDraftSchema = z
  .object({
    draftRef: GovernedRequestCreationSafeTextSchema.nullable().optional(),
    tenantRef: GovernedRequestCreationSafeTextSchema.nullable().optional(),
    requesterRef: GovernedRequestCreationSafeTextSchema.nullable().optional(),
    resourceRef: GovernedRequestCreationSafeTextSchema.nullable().optional(),
    requestPurpose: GovernedRequestCreationSafeSummarySchema
      .nullable()
      .optional(),
    actionType: GovernedRequestCreationSafeTextSchema.nullable().optional(),
    requestMode: z.enum(GovernedRequestCreationRequestModes).nullable().optional(),
    riskHint: z.enum(GovernedRequestCreationRiskHints).nullable().optional(),
    expectedPolicyOutcome: z
      .enum(GovernedRequestCreationExpectedOutcomes)
      .nullable()
      .optional(),
    expectedAdmissionOutcome: z
      .enum(GovernedRequestCreationExpectedOutcomes)
      .nullable()
      .optional(),
    approvalExpected: z.boolean().nullable().optional(),
    expectedApprovalRole: GovernedRequestCreationSafeTextSchema
      .nullable()
      .optional(),
    expectedInvestigationSections: z
      .array(GovernedRequestCreationSafeTextSchema)
      .max(12)
      .optional(),
    safeSummary: GovernedRequestCreationSafeSummarySchema
      .nullable()
      .optional(),
    safeWarnings: z.array(GovernedRequestCreationWarningSchema).max(12).optional(),
    nextSteps: z.array(GovernedRequestCreationSafeSummarySchema).max(8).optional(),
  })
  .strict();

export const GovernedRequestCreationPresentedModelSchema = z
  .object({
    phase: z.literal(GOVERNED_REQUEST_CREATION_SURFACE_PHASE),
    name: z.literal(GOVERNED_REQUEST_CREATION_SURFACE_NAME),
    status: z.enum(GovernedRequestCreationStatuses),
    sections: z.array(z.enum(GovernedRequestCreationSections)),
    draft: GovernedRequestCreationDraftSchema,
    requestOverview: z.array(z.unknown()),
    governancePreview: z.array(z.unknown()),
    safetyBoundary: z.array(GovernedRequestCreationSafeSummarySchema),
    expectedRunPath: z.array(GovernedRequestCreationSafeSummarySchema),
    requestSeedSummary: GovernedRequestCreationSafeSummarySchema,
    warnings: z.array(GovernedRequestCreationWarningSchema),
    nextActions: z.array(GovernedRequestCreationSafeSummarySchema),
    emptyWarningMessage: z.string().nullable(),
    emptyNextActionMessage: z.string().nullable(),
  })
  .strict();
