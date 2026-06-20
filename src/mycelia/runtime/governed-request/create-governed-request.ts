import type { Prisma, PrismaClient } from "@prisma/client";

import { admitGovernedRequest } from "../admission";
import { classifyGovernedRequest } from "../classify";
import { prisma } from "../db/client";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";
import { LIVE_DEMO_SCENARIO } from "../demo-scenario";
import { createPrismaAdmissionRepository } from "../repositories/prisma-admission.repository";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";
import { createPrismaPolicyRepository } from "../repositories/prisma-policy.repository";
import { createPrismaRuntimeStateRepository } from "../repositories/prisma-runtime-state.repository";

export type CreateGovernedRequestSuccess = {
  readonly ok: true;
  readonly runId: string;
  readonly correlationId: string;
  readonly currentState: "WAITING_APPROVAL";
  readonly status: "WAITING_APPROVAL";
  readonly riskLevel: "MEDIUM";
  readonly admissionOutcome: "APPROVAL_REQUIRED";
  readonly lifecycleIntentHint: "WAITING_APPROVAL";
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

export type CreateGovernedRequestInput = {
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
  input: CreateGovernedRequestInput = {},
): Promise<CreateGovernedRequestResult> {
  const client = input.client ?? prisma;
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;
  const runId = crypto.randomUUID();
  const correlationId = crypto.randomUUID();

  try {
    return await client.$transaction(async (tx) => {
      const repositories = createRepositories(tx);
      const scenario = LIVE_DEMO_SCENARIO;

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

      if (classification.riskLevel !== "MEDIUM") {
        throw new Error("LIVE-2 deterministic classifier failed closed.");
      }

      await repositories.policy.createDecision({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        riskLevel: classification.riskLevel,
        outcome: "APPROVAL_REQUIRED",
        reasonCode: classification.reasonCode,
        safeSummary: classification.safeSummary,
        policyRef: scenario.policyRef,
      });

      const admission = admitGovernedRequest(classification.riskLevel);

      if (
        admission.outcome !== "APPROVAL_REQUIRED" ||
        admission.lifecycleIntentHint !== "WAITING_APPROVAL"
      ) {
        throw new Error("LIVE-2 deterministic admission failed closed.");
      }

      await repositories.admission.createDecision({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        outcome: admission.outcome,
        reasonCode: admission.reasonCode,
        safeSummary: admission.safeSummary,
        lifecycleIntentHint: admission.lifecycleIntentHint,
      });

      await repositories.audit.create({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        moment: "POLICY_EVALUATED",
        requirement: "REQUIRED",
        recordKindHint: "POLICY_DECISION_RECORD",
        reasonCode: "POLICY_EVALUATED",
        safeSummary:
          "Policy evaluation classified the fixture as medium risk and required approval.",
        subjectRef: runId,
        actorRef: scenario.requesterRef,
        evidenceRef: scenario.policyRef,
      });

      await repositories.runs.updateState({
        tenantId,
        id: runId,
        currentState: admission.lifecycleIntentHint,
        status: admission.lifecycleIntentHint,
      });

      await repositories.state.createSnapshot({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: runId,
        state: admission.lifecycleIntentHint,
        sequence: 2,
        reasonCode: "POLICY_REQUIRES_APPROVAL",
        safeSummary:
          "Medium risk policy evaluation moved the run to awaiting approval.",
      });

      return {
        ok: true,
        runId,
        correlationId,
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
        riskLevel: classification.riskLevel,
        admissionOutcome: admission.outcome,
        lifecycleIntentHint: "WAITING_APPROVAL",
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