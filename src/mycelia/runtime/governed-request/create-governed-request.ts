import type { Prisma, PrismaClient } from "@prisma/client";

import { admitGovernedRequest, type AdmissionOutcome } from "../admission";
import { classifyGovernedRequest, type DemoRiskLevel } from "../classify";
import { prisma } from "../db/client";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";
import {
  findLiveDemoScenarioByKey,
  type LiveDemoScenarioKey,
} from "../demo-scenario";
import { createPrismaAdmissionRepository } from "../repositories/prisma-admission.repository";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";
import { createPrismaPolicyRepository } from "../repositories/prisma-policy.repository";
import { createPrismaRuntimeStateRepository } from "../repositories/prisma-runtime-state.repository";

export type CreateGovernedRequestSuccess = {
  readonly ok: true;
  readonly runId: string;
  readonly correlationId: string;
  readonly scenarioKey: LiveDemoScenarioKey;
  readonly scenarioTitle: string;
  readonly currentState: CreateGovernedRequestFinalState;
  readonly status: CreateGovernedRequestFinalState;
  readonly riskLevel: CreateGovernedRequestRiskLevel;
  readonly admissionOutcome: CreateGovernedRequestAdmissionOutcome;
  readonly lifecycleIntentHint: CreateGovernedRequestFinalState;
  readonly policyReasonCode: string;
  readonly admissionReasonCode: string;
  readonly safeSummary: string;
  readonly auditCount: 2;
};

export type CreateGovernedRequestFailure = {
  readonly ok: false;
  readonly status: "FAILED_SAFE";
  readonly safeReason: string;
};

export type CreateGovernedRequestResult =
  | CreateGovernedRequestSuccess
  | CreateGovernedRequestFailure;

export type CreateGovernedRequestRiskLevel = Exclude<
  DemoRiskLevel,
  "UNKNOWN"
>;

export type CreateGovernedRequestAdmissionOutcome = Exclude<
  AdmissionOutcome,
  "FAILED_SAFE"
>;

export type CreateGovernedRequestFinalState =
  | "COMPLETED"
  | "WAITING_APPROVAL"
  | "REJECTED";

export type CreateGovernedRequestInput = {
  readonly scenarioKey: LiveDemoScenarioKey;
  readonly client?: PrismaClient;
  readonly tenantId?: string;
};

type RuntimeTransactionClient = Prisma.TransactionClient;

function createRepositories(client: RuntimeTransactionClient) {
  return {
    runs: createPrismaGovernedRunRepository(client),
    state: createPrismaRuntimeStateRepository(client),
    audit: createPrismaAuditRepository(client),
    policy: createPrismaPolicyRepository(client),
    admission: createPrismaAdmissionRepository(client),
  };
}

export async function createGovernedRequest(
  input: CreateGovernedRequestInput,
): Promise<CreateGovernedRequestResult> {
  const client = input.client ?? prisma;
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;
  const scenario = findLiveDemoScenarioByKey(input.scenarioKey);
  const runId = crypto.randomUUID();
  const correlationId = crypto.randomUUID();

  if (scenario === null) {
    return {
      ok: false,
      status: "FAILED_SAFE",
      safeReason:
        "Selected fixture scenario was not recognized, so no run was created.",
    };
  }

  try {
    return await client.$transaction(async (tx) => {
      const repositories = createRepositories(tx);

      await repositories.runs.create({
        id: runId,
        tenantId,
        correlationId,
        currentState: "CREATED",
        status: "CREATED",
        resourceRef: scenario.resourceRef,
        requesterRef: scenario.requesterRef,
        purpose: scenario.purpose,
      });

      await repositories.state.createSnapshot({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        state: "CREATED",
        sequence: 1,
        reasonCode: "RUN_CREATED",
        safeSummary: "Governed request was created from fixture metadata.",
      });

      await repositories.audit.create({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        moment: "RUN_CREATED",
        requirement: "REQUIRED",
        recordKindHint: "GOVERNED_RUN",
        reasonCode: "RUN_CREATED",
        safeSummary: "Governed run creation was recorded.",
        subjectRef: runId,
        actorRef: scenario.requesterRef,
        evidenceRef: scenario.resourceRef,
      });

      const classification = classifyGovernedRequest({
        resourceRef: scenario.resourceRef,
        purpose: scenario.purpose,
      });

      if (classification.riskLevel === "UNKNOWN") {
        throw new Error("Deterministic classifier failed closed.");
      }

      const admission = admitGovernedRequest(classification.riskLevel);
      const admissionOutcome = admission.outcome;
      const lifecycleIntentHint = admission.lifecycleIntentHint;

      if (
        admissionOutcome === "FAILED_SAFE" ||
        !isSupportedFinalState(lifecycleIntentHint)
      ) {
        throw new Error("Deterministic readiness check failed closed.");
      }

      await repositories.policy.createDecision({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        riskLevel: classification.riskLevel,
        outcome: admissionOutcome,
        reasonCode: classification.reasonCode,
        safeSummary: classification.safeSummary,
        policyRef: scenario.policyRef,
      });

      await repositories.admission.createDecision({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        outcome: admissionOutcome,
        reasonCode: admission.reasonCode,
        safeSummary: admission.safeSummary,
        lifecycleIntentHint,
      });

      await repositories.audit.create({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        moment: "POLICY_EVALUATED",
        requirement: "REQUIRED",
        recordKindHint: "POLICY_DECISION_RECORD",
        reasonCode: "POLICY_EVALUATED",
        safeSummary: `${classification.safeSummary} ${admission.safeSummary}`,
        subjectRef: runId,
        actorRef: scenario.requesterRef,
        evidenceRef: scenario.policyRef,
      });

      await repositories.runs.updateState({
        tenantId,
        id: runId,
        currentState: lifecycleIntentHint,
        status: lifecycleIntentHint,
      });

      await repositories.state.createSnapshot({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        state: lifecycleIntentHint,
        sequence: 2,
        reasonCode: admission.reasonCode,
        safeSummary: admission.safeSummary,
      });

      return {
        ok: true,
        runId,
        correlationId,
        scenarioKey: scenario.scenarioKey,
        scenarioTitle: scenario.title,
        currentState: lifecycleIntentHint,
        status: lifecycleIntentHint,
        riskLevel: classification.riskLevel,
        admissionOutcome,
        lifecycleIntentHint,
        policyReasonCode: classification.reasonCode,
        admissionReasonCode: admission.reasonCode,
        safeSummary: admission.safeSummary,
        auditCount: 2,
      } satisfies CreateGovernedRequestSuccess;
    });
  } catch {
    return {
      ok: false,
      status: "FAILED_SAFE",
      safeReason:
        "Governed request creation failed before completing the atomic write path.",
    };
  }
}

function isSupportedFinalState(
  value: string,
): value is CreateGovernedRequestFinalState {
  return (
    value === "COMPLETED" ||
    value === "WAITING_APPROVAL" ||
    value === "REJECTED"
  );
}
