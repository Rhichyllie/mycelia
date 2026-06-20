import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";
import { createPrismaRuntimeStateRepository } from "../repositories/prisma-runtime-state.repository";

export type ApprovalDecisionOutcome = "APPROVE" | "REJECT";
export type ApprovalFinalState = "APPROVED" | "REJECTED";
export type ApprovalDecisionReasonCode =
  | "APPROVAL_ACCEPTED"
  | "APPROVAL_REJECTED";

export type DecideApprovalRequestSuccess = {
  readonly ok: true;
  readonly runId: string;
  readonly approvalRequestId: string;
  readonly currentState: ApprovalFinalState;
  readonly status: ApprovalFinalState;
  readonly approvalStatus: ApprovalFinalState;
  readonly decisionOutcome: ApprovalDecisionOutcome;
  readonly decisionReasonCode: ApprovalDecisionReasonCode;
  readonly safeDecisionSummary: string;
  readonly approverRef: string;
  readonly decidedAt: Date;
};

export type DecideApprovalRequestFailure = {
  readonly ok: false;
  readonly status: "FAILED_SAFE";
  readonly reasonCode:
    | "NO_WAITING_APPROVAL_RUN"
    | "RUN_NOT_WAITING_APPROVAL"
    | "APPROVAL_REQUEST_NOT_PENDING"
    | "APPROVAL_DECISION_FAILED";
  readonly safeReason: string;
};

export type DecideApprovalRequestResult =
  | DecideApprovalRequestSuccess
  | DecideApprovalRequestFailure;

export type DecideApprovalRequestInput = {
  readonly runId: string;
  readonly decision: ApprovalDecisionOutcome;
  readonly client?: PrismaClient;
  readonly tenantId?: string;
};

type RuntimeTransactionClient = Prisma.TransactionClient;

function createRepositories(client: RuntimeTransactionClient) {
  return {
    runs: createPrismaGovernedRunRepository(client),
    approvals: createPrismaApprovalRequestRepository(client),
    state: createPrismaRuntimeStateRepository(client),
    audit: createPrismaAuditRepository(client),
  };
}

function failClosed(
  reasonCode: DecideApprovalRequestFailure["reasonCode"],
  safeReason: string,
): DecideApprovalRequestFailure {
  return {
    ok: false,
    status: "FAILED_SAFE",
    reasonCode,
    safeReason,
  };
}

function decisionSpec(decision: ApprovalDecisionOutcome): {
  readonly finalState: ApprovalFinalState;
  readonly reasonCode: ApprovalDecisionReasonCode;
  readonly safeSummary: string;
} {
  if (decision === "APPROVE") {
    return {
      finalState: "APPROVED",
      reasonCode: "APPROVAL_ACCEPTED",
      safeSummary:
        "The pending approval request was approved for the controlled demo fixture.",
    };
  }

  return {
    finalState: "REJECTED",
    reasonCode: "APPROVAL_REJECTED",
    safeSummary:
      "The pending approval request was rejected for the controlled demo fixture.",
  };
}

export async function decideApprovalRequest(
  input: DecideApprovalRequestInput,
): Promise<DecideApprovalRequestResult> {
  const client = input.client ?? prisma;
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;
  const { approverRef } = getMyceliaDemoDatabaseConfig();

  try {
    return await client.$transaction(async (tx) => {
      const repositories = createRepositories(tx);
      const run = await repositories.runs.findById({
        tenantId,
        id: input.runId,
      });

      if (
        run === null ||
        run.currentState !== "WAITING_APPROVAL" ||
        run.status !== "WAITING_APPROVAL"
      ) {
        return failClosed(
          "RUN_NOT_WAITING_APPROVAL",
          "Only governed runs waiting for approval may be decided.",
        );
      }

      const approvalRequest = await repositories.approvals.findForRun({
        tenantId,
        governedRunId: input.runId,
      });

      if (approvalRequest === null || approvalRequest.status !== "PENDING") {
        return failClosed(
          "APPROVAL_REQUEST_NOT_PENDING",
          "Only pending approval requests may be decided.",
        );
      }

      const spec = decisionSpec(input.decision);
      const decidedAt = new Date();
      const updatedApproval = await repositories.approvals.updateDecision({
        tenantId,
        id: approvalRequest.id,
        status: spec.finalState,
        decisionOutcome: input.decision,
        decisionReasonCode: spec.reasonCode,
        safeDecisionSummary: spec.safeSummary,
        approverRef,
        decidedAt,
      });

      await repositories.audit.create({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: input.runId,
        moment: "APPROVAL_DECIDED",
        requirement: "REQUIRED",
        recordKindHint: "APPROVAL_REQUEST",
        reasonCode: spec.reasonCode,
        safeSummary: spec.safeSummary,
        subjectRef: input.runId,
        actorRef: approverRef,
        evidenceRef: approvalRequest.id,
      });

      await repositories.runs.updateState({
        tenantId,
        id: input.runId,
        currentState: spec.finalState,
        status: spec.finalState,
      });

      await repositories.state.createSnapshot({
        id: crypto.randomUUID(),
        tenantId,
        governedRunId: input.runId,
        state: spec.finalState,
        sequence: 3,
        reasonCode: spec.reasonCode,
        safeSummary: spec.safeSummary,
      });

      return {
        ok: true,
        runId: input.runId,
        approvalRequestId: approvalRequest.id,
        currentState: spec.finalState,
        status: spec.finalState,
        approvalStatus: spec.finalState,
        decisionOutcome: input.decision,
        decisionReasonCode: spec.reasonCode,
        safeDecisionSummary: spec.safeSummary,
        approverRef,
        decidedAt: updatedApproval.decidedAt ?? decidedAt,
      } satisfies DecideApprovalRequestSuccess;
    });
  } catch {
    return failClosed(
      "APPROVAL_DECISION_FAILED",
      "Approval decision failed before completing the atomic write path.",
    );
  }
}
