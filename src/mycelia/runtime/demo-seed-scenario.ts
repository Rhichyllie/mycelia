import type { PrismaClient } from "@prisma/client";

import { admitGovernedRequest } from "./admission";
import { classifyGovernedRequest } from "./classify";
import { getMyceliaDemoDatabaseConfig } from "./db/demo-config";
import { LIVE_DEMO_SCENARIO } from "./demo-scenario";

export const DEMO_SEED_GOVERNED_RUN_ID =
  "demo_run_medium_risk_vendor_contract_review";
export const DEMO_SEED_CORRELATION_ID = LIVE_DEMO_SCENARIO.scenarioKey;
export const DEMO_SEED_STATE_CREATED_ID =
  "demo_state_medium_risk_vendor_contract_review_01";
export const DEMO_SEED_STATE_WAITING_APPROVAL_ID =
  "demo_state_medium_risk_vendor_contract_review_02";
export const DEMO_SEED_POLICY_ID =
  "demo_policy_medium_risk_vendor_contract_review";
export const DEMO_SEED_ADMISSION_ID =
  "demo_admission_medium_risk_vendor_contract_review";
export const DEMO_SEED_AUDIT_RUN_CREATED_ID =
  "demo_audit_medium_risk_vendor_contract_review";
export const DEMO_SEED_AUDIT_POLICY_EVALUATED_ID =
  "demo_audit_medium_risk_vendor_contract_review_02";

export type DemoSeedScenarioClient = Pick<
  PrismaClient,
  | "admissionDecisionRecord"
  | "auditRecord"
  | "governedRun"
  | "policyDecisionRecord"
  | "runtimeStateSnapshot"
>;

export type SeedDemoScenarioInput = {
  readonly client: DemoSeedScenarioClient;
  readonly tenantId?: string;
};

export type SeedDemoScenarioResult = {
  readonly tenantId: string;
  readonly governedRunId: typeof DEMO_SEED_GOVERNED_RUN_ID;
  readonly currentState: "WAITING_APPROVAL";
  readonly status: "WAITING_APPROVAL";
};

export async function seedDemoScenario(
  input: SeedDemoScenarioInput,
): Promise<SeedDemoScenarioResult> {
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;
  const scenario = LIVE_DEMO_SCENARIO;
  const classification = classifyGovernedRequest({
    resourceRef: scenario.resourceRef,
    purpose: scenario.purpose,
  });
  const admission = admitGovernedRequest(classification.riskLevel);

  if (
    classification.riskLevel !== "MEDIUM" ||
    admission.outcome !== "APPROVAL_REQUIRED" ||
    admission.lifecycleIntentHint !== "WAITING_APPROVAL"
  ) {
    throw new Error("Demo seed scenario failed closed before persistence.");
  }

  await input.client.governedRun.upsert({
    where: {
      tenantId_correlationId: {
        tenantId,
        correlationId: DEMO_SEED_CORRELATION_ID,
      },
    },
    update: {
      currentState: admission.lifecycleIntentHint,
      status: admission.lifecycleIntentHint,
      resourceRef: scenario.resourceRef,
      requesterRef: scenario.requesterRef,
      purpose: scenario.purpose,
    },
    create: {
      id: DEMO_SEED_GOVERNED_RUN_ID,
      tenantId,
      correlationId: DEMO_SEED_CORRELATION_ID,
      currentState: admission.lifecycleIntentHint,
      status: admission.lifecycleIntentHint,
      resourceRef: scenario.resourceRef,
      requesterRef: scenario.requesterRef,
      purpose: scenario.purpose,
    },
  });

  await input.client.runtimeStateSnapshot.upsert({
    where: { id: DEMO_SEED_STATE_CREATED_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      state: "CREATED",
      sequence: 1,
      reasonCode: "RUN_CREATED",
      safeSummary: "Governed request was created from fixture metadata.",
    },
    create: {
      id: DEMO_SEED_STATE_CREATED_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      state: "CREATED",
      sequence: 1,
      reasonCode: "RUN_CREATED",
      safeSummary: "Governed request was created from fixture metadata.",
    },
  });

  await input.client.runtimeStateSnapshot.upsert({
    where: { id: DEMO_SEED_STATE_WAITING_APPROVAL_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      state: admission.lifecycleIntentHint,
      sequence: 2,
      reasonCode: "POLICY_REQUIRES_APPROVAL",
      safeSummary:
        "Medium risk policy evaluation moved the run to awaiting approval.",
    },
    create: {
      id: DEMO_SEED_STATE_WAITING_APPROVAL_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      state: admission.lifecycleIntentHint,
      sequence: 2,
      reasonCode: "POLICY_REQUIRES_APPROVAL",
      safeSummary:
        "Medium risk policy evaluation moved the run to awaiting approval.",
    },
  });

  await input.client.policyDecisionRecord.upsert({
    where: { id: DEMO_SEED_POLICY_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      riskLevel: classification.riskLevel,
      outcome: admission.outcome,
      reasonCode: classification.reasonCode,
      safeSummary: classification.safeSummary,
      policyRef: scenario.policyRef,
    },
    create: {
      id: DEMO_SEED_POLICY_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      riskLevel: classification.riskLevel,
      outcome: admission.outcome,
      reasonCode: classification.reasonCode,
      safeSummary: classification.safeSummary,
      policyRef: scenario.policyRef,
    },
  });

  await input.client.admissionDecisionRecord.upsert({
    where: { id: DEMO_SEED_ADMISSION_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      outcome: admission.outcome,
      reasonCode: admission.reasonCode,
      safeSummary: admission.safeSummary,
      lifecycleIntentHint: admission.lifecycleIntentHint,
    },
    create: {
      id: DEMO_SEED_ADMISSION_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      outcome: admission.outcome,
      reasonCode: admission.reasonCode,
      safeSummary: admission.safeSummary,
      lifecycleIntentHint: admission.lifecycleIntentHint,
    },
  });

  await input.client.auditRecord.upsert({
    where: { id: DEMO_SEED_AUDIT_RUN_CREATED_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      moment: "RUN_CREATED",
      requirement: "REQUIRED",
      recordKindHint: "GOVERNED_RUN",
      reasonCode: "RUN_CREATED",
      safeSummary: "Governed run creation was recorded.",
      subjectRef: DEMO_SEED_GOVERNED_RUN_ID,
      actorRef: scenario.requesterRef,
      evidenceRef: scenario.resourceRef,
    },
    create: {
      id: DEMO_SEED_AUDIT_RUN_CREATED_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      moment: "RUN_CREATED",
      requirement: "REQUIRED",
      recordKindHint: "GOVERNED_RUN",
      reasonCode: "RUN_CREATED",
      safeSummary: "Governed run creation was recorded.",
      subjectRef: DEMO_SEED_GOVERNED_RUN_ID,
      actorRef: scenario.requesterRef,
      evidenceRef: scenario.resourceRef,
    },
  });

  await input.client.auditRecord.upsert({
    where: { id: DEMO_SEED_AUDIT_POLICY_EVALUATED_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      moment: "POLICY_EVALUATED",
      requirement: "REQUIRED",
      recordKindHint: "POLICY_DECISION_RECORD",
      reasonCode: "POLICY_EVALUATED",
      safeSummary:
        "Policy evaluation classified the fixture as medium risk and required approval.",
      subjectRef: DEMO_SEED_GOVERNED_RUN_ID,
      actorRef: scenario.requesterRef,
      evidenceRef: scenario.policyRef,
    },
    create: {
      id: DEMO_SEED_AUDIT_POLICY_EVALUATED_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      moment: "POLICY_EVALUATED",
      requirement: "REQUIRED",
      recordKindHint: "POLICY_DECISION_RECORD",
      reasonCode: "POLICY_EVALUATED",
      safeSummary:
        "Policy evaluation classified the fixture as medium risk and required approval.",
      subjectRef: DEMO_SEED_GOVERNED_RUN_ID,
      actorRef: scenario.requesterRef,
      evidenceRef: scenario.policyRef,
    },
  });

  return {
    tenantId,
    governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
    currentState: "WAITING_APPROVAL",
    status: "WAITING_APPROVAL",
  };
}
