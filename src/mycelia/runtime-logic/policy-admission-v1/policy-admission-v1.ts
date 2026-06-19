import { z } from "zod";

import {
  err,
  ok,
  CorrelationIdSchema,
  RunIdSchema,
  TenantIdSchema,
  type CorrelationId,
  type Result,
} from "../../foundation/shared-kernel";
import {
  PolicyActionSchema,
  PolicyPurposeSchema,
} from "../../domain-contracts/policy-decision-gateway";
import {
  GovernedRunLifecycleIntentSchema,
  type GovernedRunLifecycleIntent,
} from "../../runtime-logic/governed-run-lifecycle";
import { RUNTIME_SLICE_POLICY_ADMISSION_V1 } from "../../planning/runtime-slice-technical-plan";

export const POLICY_ADMISSION_V1_PHASE = "2T";

export const POLICY_ADMISSION_V1_NAME = "Policy/Admission v1";

export const POLICY_ADMISSION_V1_STATUS =
  "pure TypeScript deterministic policy/admission logic only";

export const PolicyAdmissionRiskLevels = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "UNKNOWN",
  "UNSAFE",
] as const;

export type PolicyAdmissionRiskLevel =
  (typeof PolicyAdmissionRiskLevels)[number];

export const PolicyAdmissionOutcomes = [
  "ADMIT",
  "REQUIRE_APPROVAL",
  "DENY",
] as const;

export type PolicyAdmissionOutcome =
  (typeof PolicyAdmissionOutcomes)[number];

export const PolicyAdmissionContextStatuses = [
  "RESOLVED",
  "MISSING",
  "AMBIGUOUS",
] as const;

export type PolicyAdmissionContextStatus =
  (typeof PolicyAdmissionContextStatuses)[number];

export const PolicyAdmissionTenantBoundaryStatuses = [
  "MATCHED",
  "MISMATCHED",
  "UNKNOWN",
] as const;

export type PolicyAdmissionTenantBoundaryStatus =
  (typeof PolicyAdmissionTenantBoundaryStatuses)[number];

export const PolicyAdmissionRiskLevelSchema = z.enum(
  PolicyAdmissionRiskLevels,
);

export const PolicyAdmissionOutcomeSchema = z.enum(PolicyAdmissionOutcomes);

export const PolicyAdmissionContextStatusSchema = z.enum(
  PolicyAdmissionContextStatuses,
);

export const PolicyAdmissionTenantBoundaryStatusSchema = z.enum(
  PolicyAdmissionTenantBoundaryStatuses,
);

const MAX_POLICY_ADMISSION_SAFE_REF_LENGTH = 160;
const MAX_POLICY_ADMISSION_METADATA_KEYS = 16;
const MAX_POLICY_ADMISSION_METADATA_VALUE_LENGTH = 160;
const POLICY_ADMISSION_UNSAFE_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection[_-]?string|credential|display[_-]?name|email|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|query|raw|secret|shell|sql|sudo|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;

export const PolicyAdmissionSafeRefSchema = z
  .string()
  .min(1, "safe reference is required.")
  .max(
    MAX_POLICY_ADMISSION_SAFE_REF_LENGTH,
    `safe reference must not exceed ${MAX_POLICY_ADMISSION_SAFE_REF_LENGTH} characters.`,
  )
  .refine(
    (value) => value.trim() === value,
    "safe reference must not contain leading or trailing whitespace.",
  )
  .refine(
    (value) => !POLICY_ADMISSION_UNSAFE_TEXT_PATTERN.test(value),
    "safe reference must be opaque and bounded.",
  );

const PolicyAdmissionSafeMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !POLICY_ADMISSION_UNSAFE_TEXT_PATTERN.test(key),
    "policy/admission metadata key is unsafe.",
  );

const PolicyAdmissionSafeMetadataValueSchema = z.union([
  z
    .string()
    .max(MAX_POLICY_ADMISSION_METADATA_VALUE_LENGTH)
    .refine(
      (value) => !POLICY_ADMISSION_UNSAFE_TEXT_PATTERN.test(value),
      "policy/admission metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const PolicyAdmissionSafeMetadataSchema = z
  .record(
    PolicyAdmissionSafeMetadataKeySchema,
    PolicyAdmissionSafeMetadataValueSchema,
  )
  .refine(
    (metadata) =>
      Object.keys(metadata).length <= MAX_POLICY_ADMISSION_METADATA_KEYS,
    `policy/admission metadata must not exceed ${MAX_POLICY_ADMISSION_METADATA_KEYS} keys.`,
  );

export const PolicyAdmissionV1InputSchema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    requester_ref: PolicyAdmissionSafeRefSchema,
    resource_ref: PolicyAdmissionSafeRefSchema,
    action: PolicyActionSchema,
    purpose: PolicyPurposeSchema,
    risk_level: PolicyAdmissionRiskLevelSchema,
    context_status: PolicyAdmissionContextStatusSchema,
    tenant_boundary_status: PolicyAdmissionTenantBoundaryStatusSchema,
    has_required_context: z.boolean(),
    policy_ref: PolicyAdmissionSafeRefSchema.optional(),
    policy_version: PolicyAdmissionSafeRefSchema.optional(),
    metadata: PolicyAdmissionSafeMetadataSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.run_id === undefined && input.correlation_id === undefined) {
      context.addIssue({
        code: "custom",
        message: "run_id or correlation_id is required.",
        path: ["run_id"],
      });
    }

    if (input.policy_ref === undefined && input.policy_version === undefined) {
      context.addIssue({
        code: "custom",
        message: "policy_ref or policy_version is required.",
        path: ["policy_ref"],
      });
    }
  });

export type PolicyAdmissionV1Input = z.infer<
  typeof PolicyAdmissionV1InputSchema
>;

export type PolicyAdmissionV1InputCandidate = z.input<
  typeof PolicyAdmissionV1InputSchema
>;

export const PolicyAdmissionV1ReasonCodeSchema = z.enum([
  "LOW_RISK_ADMITTED",
  "MEDIUM_RISK_REQUIRES_APPROVAL",
  "HIGH_RISK_DENIED",
  "UNKNOWN_RISK_REQUIRES_APPROVAL",
  "UNKNOWN_RISK_DENIED",
  "UNSAFE_RISK_DENIED",
  "MISSING_REQUIRED_CONTEXT_DENIED",
  "MISSING_CONTEXT_DENIED",
  "AMBIGUOUS_CONTEXT_REQUIRES_APPROVAL",
  "AMBIGUOUS_CONTEXT_DENIED",
  "TENANT_BOUNDARY_MISMATCH_DENIED",
  "TENANT_BOUNDARY_UNKNOWN_DENIED",
  "POLICY_ADMISSION_FAIL_CLOSED",
]);

export type PolicyAdmissionV1ReasonCode = z.infer<
  typeof PolicyAdmissionV1ReasonCodeSchema
>;

export const PolicyAdmissionV1DenialCodeSchema = z.enum([
  "POLICY_ADMISSION_INPUT_REQUIRED",
  "POLICY_ADMISSION_INPUT_INVALID",
  "POLICY_ADMISSION_TENANT_REQUIRED",
  "POLICY_ADMISSION_SCOPE_REQUIRED",
  "POLICY_ADMISSION_POLICY_REFERENCE_REQUIRED",
  "POLICY_ADMISSION_UNSAFE_METADATA",
]);

export type PolicyAdmissionV1DenialCode = z.infer<
  typeof PolicyAdmissionV1DenialCodeSchema
>;

export const PolicyAdmissionV1PersistenceMappingSchema = z
  .object({
    policy_decision_record: z.literal("PolicyDecisionRecord"),
    admission_decision_record: z.literal("AdmissionDecisionRecord"),
    approval_request_record: z.literal("ApprovalRequest").optional(),
    audit_record: z.literal("AuditRecord later"),
  })
  .strict();

export type PolicyAdmissionV1PersistenceMapping = z.infer<
  typeof PolicyAdmissionV1PersistenceMappingSchema
>;

export const PolicyAdmissionV1DecisionSchema = z
  .object({
    outcome: PolicyAdmissionOutcomeSchema,
    risk_level: PolicyAdmissionRiskLevelSchema,
    reason_code: PolicyAdmissionV1ReasonCodeSchema,
    safe_reason: z.string().min(1).max(240),
    requires_approval: z.boolean(),
    lifecycle_intent_hint: GovernedRunLifecycleIntentSchema,
    persistence_mapping: PolicyAdmissionV1PersistenceMappingSchema,
    policy_gateway_alignment: z.literal("policy-decision-gateway"),
    admission_gateway_alignment: z.literal("runtime-admission-gateway"),
    audit_implication: z.literal(
      "future audit descriptor should be addressable; no audit record is written",
    ),
  })
  .strict();

export type PolicyAdmissionV1Decision = z.infer<
  typeof PolicyAdmissionV1DecisionSchema
>;

export const PolicyAdmissionV1DenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    code: PolicyAdmissionV1DenialCodeSchema,
    message: z.literal("The policy/admission input is not accepted."),
    safe_reason: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export type PolicyAdmissionV1Denial = z.infer<
  typeof PolicyAdmissionV1DenialSchema
>;

export type PolicyAdmissionV1RuleDescriptor = {
  readonly condition: string;
  readonly outcome: PolicyAdmissionOutcome;
  readonly reason_code: PolicyAdmissionV1ReasonCode;
  readonly lifecycle_intent_hint: GovernedRunLifecycleIntent;
};

export type PolicyAdmissionV1 = {
  readonly phase: typeof POLICY_ADMISSION_V1_PHASE;
  readonly name: typeof POLICY_ADMISSION_V1_NAME;
  readonly status: typeof POLICY_ADMISSION_V1_STATUS;
  readonly risk_levels: readonly PolicyAdmissionRiskLevel[];
  readonly outcomes: readonly PolicyAdmissionOutcome[];
  readonly context_statuses: readonly PolicyAdmissionContextStatus[];
  readonly tenant_boundary_statuses:
    readonly PolicyAdmissionTenantBoundaryStatus[];
  readonly deterministic_rules: readonly PolicyAdmissionV1RuleDescriptor[];
  readonly lifecycle_mapping: readonly string[];
  readonly persistence_mapping: readonly string[];
  readonly module_alignment: readonly string[];
  readonly plan_alignment: readonly string[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const POLICY_ADMISSION_V1_DETERMINISTIC_RULES = [
  {
    condition: "missing required context",
    outcome: "DENY",
    reason_code: "MISSING_REQUIRED_CONTEXT_DENIED",
    lifecycle_intent_hint: "REJECT",
  },
  {
    condition: "context missing",
    outcome: "DENY",
    reason_code: "MISSING_CONTEXT_DENIED",
    lifecycle_intent_hint: "REJECT",
  },
  {
    condition: "context ambiguous with matched tenant boundary",
    outcome: "REQUIRE_APPROVAL",
    reason_code: "AMBIGUOUS_CONTEXT_REQUIRES_APPROVAL",
    lifecycle_intent_hint: "REQUIRE_APPROVAL",
  },
  {
    condition: "context ambiguous without matched tenant boundary",
    outcome: "DENY",
    reason_code: "AMBIGUOUS_CONTEXT_DENIED",
    lifecycle_intent_hint: "REJECT",
  },
  {
    condition: "tenant boundary mismatched",
    outcome: "DENY",
    reason_code: "TENANT_BOUNDARY_MISMATCH_DENIED",
    lifecycle_intent_hint: "REJECT",
  },
  {
    condition: "tenant boundary unknown",
    outcome: "DENY",
    reason_code: "TENANT_BOUNDARY_UNKNOWN_DENIED",
    lifecycle_intent_hint: "REJECT",
  },
  {
    condition: "low risk with resolved context and matched tenant boundary",
    outcome: "ADMIT",
    reason_code: "LOW_RISK_ADMITTED",
    lifecycle_intent_hint: "GRANT_ADMISSION",
  },
  {
    condition: "medium risk with resolved context and matched tenant boundary",
    outcome: "REQUIRE_APPROVAL",
    reason_code: "MEDIUM_RISK_REQUIRES_APPROVAL",
    lifecycle_intent_hint: "REQUIRE_APPROVAL",
  },
  {
    condition: "high risk",
    outcome: "DENY",
    reason_code: "HIGH_RISK_DENIED",
    lifecycle_intent_hint: "REJECT",
  },
  {
    condition: "unknown risk with resolved context and matched tenant boundary",
    outcome: "REQUIRE_APPROVAL",
    reason_code: "UNKNOWN_RISK_REQUIRES_APPROVAL",
    lifecycle_intent_hint: "REQUIRE_APPROVAL",
  },
  {
    condition: "unknown risk without resolved context and matched tenant boundary",
    outcome: "DENY",
    reason_code: "UNKNOWN_RISK_DENIED",
    lifecycle_intent_hint: "REJECT",
  },
  {
    condition: "unsafe risk",
    outcome: "DENY",
    reason_code: "UNSAFE_RISK_DENIED",
    lifecycle_intent_hint: "REJECT",
  },
] as const satisfies readonly PolicyAdmissionV1RuleDescriptor[];

export const POLICY_ADMISSION_V1_LIFECYCLE_MAPPING = [
  "ADMIT maps to governed-run-lifecycle intent GRANT_ADMISSION",
  "REQUIRE_APPROVAL maps to governed-run-lifecycle intent REQUIRE_APPROVAL",
  "DENY maps to governed-run-lifecycle intent REJECT",
] as const;

export const POLICY_ADMISSION_V1_PERSISTENCE_MAPPING = [
  "all decisions map conceptually to PolicyDecisionRecord",
  "all decisions map conceptually to AdmissionDecisionRecord",
  "approval-required decisions map conceptually to ApprovalRequest",
  "all decisions should become future AuditRecord moments",
] as const;

export const POLICY_ADMISSION_V1_MODULE_ALIGNMENT = [
  "src/mycelia/domain-contracts/policy-decision-gateway/",
  "src/mycelia/domain-contracts/runtime-admission-gateway/",
  "src/mycelia/runtime-logic/governed-run-lifecycle/",
  "src/mycelia/persistence/runtime-persistence-model/",
  "src/mycelia/planning/runtime-slice-technical-plan/",
  "future audit commit boundary",
] as const;

export const POLICY_ADMISSION_V1_EXPLICITLY_OUT_OF_SCOPE = [
  "no runtime execution",
  "no persistence",
  "no DB access",
  "no migrations",
  "no repository/service layer",
  "no API",
  "no auth",
  "no UI",
  "no event emission",
  "no audit record writing",
  "no workflow execution",
  "no approval queue",
  "no replay execution",
  "no external integrations",
  "no tool execution",
  "no raw document content",
  "no export/PDF/download",
] as const;

export const POLICY_ADMISSION_V1_SAFETY_BOUNDARY = [
  "this module evaluates policy/admission in memory only",
  "this module accepts safe bounded references only",
  "this module rejects raw payload-like fields through strict schemas",
  "this module returns deterministic decisions or safe denials",
  "this module does not mutate input",
  "this module does not persist data",
  "this module does not emit events",
  "this module does not write audit records",
  "this module does not call APIs or external services",
] as const;

export const POLICY_ADMISSION_V1 = {
  phase: POLICY_ADMISSION_V1_PHASE,
  name: POLICY_ADMISSION_V1_NAME,
  status: POLICY_ADMISSION_V1_STATUS,
  risk_levels: PolicyAdmissionRiskLevels,
  outcomes: PolicyAdmissionOutcomes,
  context_statuses: PolicyAdmissionContextStatuses,
  tenant_boundary_statuses: PolicyAdmissionTenantBoundaryStatuses,
  deterministic_rules: POLICY_ADMISSION_V1_DETERMINISTIC_RULES,
  lifecycle_mapping: POLICY_ADMISSION_V1_LIFECYCLE_MAPPING,
  persistence_mapping: POLICY_ADMISSION_V1_PERSISTENCE_MAPPING,
  module_alignment: POLICY_ADMISSION_V1_MODULE_ALIGNMENT,
  plan_alignment: RUNTIME_SLICE_POLICY_ADMISSION_V1.behavior.map(
    (rule) => rule.condition,
  ),
  explicitly_out_of_scope: POLICY_ADMISSION_V1_EXPLICITLY_OUT_OF_SCOPE,
  safety_boundary: POLICY_ADMISSION_V1_SAFETY_BOUNDARY,
} as const satisfies PolicyAdmissionV1;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function correlationIdFromInput(input: unknown): CorrelationId | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const parsed = CorrelationIdSchema.safeParse(input.correlation_id);

  return parsed.success ? parsed.data : undefined;
}

function lifecycleIntentForOutcome(
  outcome: PolicyAdmissionOutcome,
): GovernedRunLifecycleIntent {
  if (outcome === "ADMIT") {
    return "GRANT_ADMISSION";
  }

  if (outcome === "REQUIRE_APPROVAL") {
    return "REQUIRE_APPROVAL";
  }

  return "REJECT";
}

function safeReasonForCode(code: PolicyAdmissionV1ReasonCode): string {
  const reasons: Record<PolicyAdmissionV1ReasonCode, string> = {
    LOW_RISK_ADMITTED:
      "Low risk with resolved context and matched boundary is admitted.",
    MEDIUM_RISK_REQUIRES_APPROVAL:
      "Medium risk requires approval before admission.",
    HIGH_RISK_DENIED: "High risk is denied by policy/admission v1.",
    UNKNOWN_RISK_REQUIRES_APPROVAL:
      "Unknown risk requires approval when context and boundary are resolved.",
    UNKNOWN_RISK_DENIED:
      "Unknown risk is denied when context or boundary is not resolved.",
    UNSAFE_RISK_DENIED: "Unsafe risk is denied by policy/admission v1.",
    MISSING_REQUIRED_CONTEXT_DENIED:
      "Required context is missing, so admission is denied.",
    MISSING_CONTEXT_DENIED: "Missing context is denied.",
    AMBIGUOUS_CONTEXT_REQUIRES_APPROVAL:
      "Ambiguous context requires approval when the boundary is matched.",
    AMBIGUOUS_CONTEXT_DENIED:
      "Ambiguous context is denied when the boundary is not matched.",
    TENANT_BOUNDARY_MISMATCH_DENIED:
      "Tenant boundary mismatch is denied.",
    TENANT_BOUNDARY_UNKNOWN_DENIED: "Unknown tenant boundary is denied.",
    POLICY_ADMISSION_FAIL_CLOSED:
      "Policy/admission v1 failed closed for the input.",
  };

  return reasons[code];
}

function createPersistenceMapping(
  outcome: PolicyAdmissionOutcome,
): PolicyAdmissionV1PersistenceMapping {
  return PolicyAdmissionV1PersistenceMappingSchema.parse({
    policy_decision_record: "PolicyDecisionRecord",
    admission_decision_record: "AdmissionDecisionRecord",
    approval_request_record:
      outcome === "REQUIRE_APPROVAL" ? "ApprovalRequest" : undefined,
    audit_record: "AuditRecord later",
  });
}

function createDecision(
  input: PolicyAdmissionV1Input,
  outcome: PolicyAdmissionOutcome,
  reasonCode: PolicyAdmissionV1ReasonCode,
): PolicyAdmissionV1Decision {
  return PolicyAdmissionV1DecisionSchema.parse({
    outcome,
    risk_level: input.risk_level,
    reason_code: reasonCode,
    safe_reason: safeReasonForCode(reasonCode),
    requires_approval: outcome === "REQUIRE_APPROVAL",
    lifecycle_intent_hint: lifecycleIntentForOutcome(outcome),
    persistence_mapping: createPersistenceMapping(outcome),
    policy_gateway_alignment: "policy-decision-gateway",
    admission_gateway_alignment: "runtime-admission-gateway",
    audit_implication:
      "future audit descriptor should be addressable; no audit record is written",
  });
}

export function failClosedPolicyAdmissionV1Denial(
  input?: unknown,
  code: PolicyAdmissionV1DenialCode = "POLICY_ADMISSION_INPUT_INVALID",
): PolicyAdmissionV1Denial {
  const safeReasonByCode: Record<PolicyAdmissionV1DenialCode, string> = {
    POLICY_ADMISSION_INPUT_REQUIRED:
      "A policy/admission input is required.",
    POLICY_ADMISSION_INPUT_INVALID:
      "The policy/admission input is invalid or unsafe.",
    POLICY_ADMISSION_TENANT_REQUIRED:
      "A tenant identity is required.",
    POLICY_ADMISSION_SCOPE_REQUIRED:
      "A run or correlation scope is required.",
    POLICY_ADMISSION_POLICY_REFERENCE_REQUIRED:
      "A policy reference or version is required.",
    POLICY_ADMISSION_UNSAFE_METADATA:
      "The policy/admission metadata is unsafe.",
  };

  return PolicyAdmissionV1DenialSchema.parse({
    outcome: "DENIED",
    code,
    message: "The policy/admission input is not accepted.",
    safe_reason: safeReasonByCode[code],
    correlation_id: correlationIdFromInput(input),
    safe: true,
  });
}

function denialForInvalidInput(input: unknown): PolicyAdmissionV1Denial {
  if (!isRecord(input)) {
    return failClosedPolicyAdmissionV1Denial(
      input,
      "POLICY_ADMISSION_INPUT_REQUIRED",
    );
  }

  if (input.tenant_id === undefined) {
    return failClosedPolicyAdmissionV1Denial(
      input,
      "POLICY_ADMISSION_TENANT_REQUIRED",
    );
  }

  if (input.run_id === undefined && input.correlation_id === undefined) {
    return failClosedPolicyAdmissionV1Denial(
      input,
      "POLICY_ADMISSION_SCOPE_REQUIRED",
    );
  }

  if (input.policy_ref === undefined && input.policy_version === undefined) {
    return failClosedPolicyAdmissionV1Denial(
      input,
      "POLICY_ADMISSION_POLICY_REFERENCE_REQUIRED",
    );
  }

  if (
    input.metadata !== undefined &&
    !PolicyAdmissionSafeMetadataSchema.safeParse(input.metadata).success
  ) {
    return failClosedPolicyAdmissionV1Denial(
      input,
      "POLICY_ADMISSION_UNSAFE_METADATA",
    );
  }

  return failClosedPolicyAdmissionV1Denial(input);
}

function decide(input: PolicyAdmissionV1Input): PolicyAdmissionV1Decision {
  if (input.tenant_boundary_status === "MISMATCHED") {
    return createDecision(input, "DENY", "TENANT_BOUNDARY_MISMATCH_DENIED");
  }

  if (input.tenant_boundary_status === "UNKNOWN") {
    return createDecision(input, "DENY", "TENANT_BOUNDARY_UNKNOWN_DENIED");
  }

  if (!input.has_required_context) {
    return createDecision(input, "DENY", "MISSING_REQUIRED_CONTEXT_DENIED");
  }

  if (input.context_status === "MISSING") {
    return createDecision(input, "DENY", "MISSING_CONTEXT_DENIED");
  }

  if (input.risk_level === "UNSAFE") {
    return createDecision(input, "DENY", "UNSAFE_RISK_DENIED");
  }

  if (input.risk_level === "HIGH") {
    return createDecision(input, "DENY", "HIGH_RISK_DENIED");
  }

  if (input.context_status === "AMBIGUOUS") {
    return createDecision(
      input,
      "REQUIRE_APPROVAL",
      "AMBIGUOUS_CONTEXT_REQUIRES_APPROVAL",
    );
  }

  if (input.risk_level === "LOW") {
    return createDecision(input, "ADMIT", "LOW_RISK_ADMITTED");
  }

  if (input.risk_level === "MEDIUM") {
    return createDecision(
      input,
      "REQUIRE_APPROVAL",
      "MEDIUM_RISK_REQUIRES_APPROVAL",
    );
  }

  if (input.risk_level === "UNKNOWN") {
    return createDecision(
      input,
      "REQUIRE_APPROVAL",
      "UNKNOWN_RISK_REQUIRES_APPROVAL",
    );
  }

  return createDecision(input, "DENY", "POLICY_ADMISSION_FAIL_CLOSED");
}

export function evaluatePolicyAdmissionV1(
  input: unknown,
): Result<PolicyAdmissionV1Decision, PolicyAdmissionV1Denial> {
  const parsed = PolicyAdmissionV1InputSchema.safeParse(input);

  if (!parsed.success) {
    return err(denialForInvalidInput(input));
  }

  return ok(decide(parsed.data));
}

export function assertPolicyAdmissionV1(
  input: unknown,
): PolicyAdmissionV1Decision {
  const result = evaluatePolicyAdmissionV1(input);

  if (!result.ok) {
    throw new Error("Policy/admission v1 decision denied.");
  }

  return result.value;
}

export function getPolicyAdmissionV1(): PolicyAdmissionV1 {
  return POLICY_ADMISSION_V1;
}
