import type { ApprovalRequest, PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";
import { createPrismaAdmissionRepository } from "./prisma-admission.repository";
import { createPrismaGovernedRunRepository } from "./prisma-governed-run.repository";

export type PrismaApprovalRequestRecord = ApprovalRequest;

export type PrismaApprovalRequestRepositoryClient = Pick<
  PrismaClient,
  "admissionDecisionRecord" | "approvalRequest" | "governedRun"
>;

export type TenantScopedRunInput = {
  readonly tenantId: string;
  readonly governedRunId: string;
};

export type UpdateApprovalRequestDecisionInput = {
  readonly tenantId: string;
  readonly id: string;
  readonly status: "APPROVED" | "REJECTED";
  readonly decisionOutcome: "APPROVE" | "REJECT";
  readonly decisionReasonCode: string;
  readonly safeDecisionSummary: string;
  readonly approverRef: string;
  readonly decidedAt: Date;
};

export type ListPendingApprovalRequestsInput = {
  readonly tenantId: string;
  readonly take: number;
};

export function createPrismaApprovalRequestRepository(
  client: PrismaApprovalRequestRepositoryClient = prisma,
) {
  const runs = createPrismaGovernedRunRepository(client);
  const admissions = createPrismaAdmissionRepository(client);

  function findForRun(
    input: TenantScopedRunInput,
  ): Promise<ApprovalRequest | null> {
    return client.approvalRequest.findFirst({
      where: {
        tenantId: input.tenantId,
        governedRunId: input.governedRunId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return {
    findForRun,
    findById(input: {
      readonly tenantId: string;
      readonly id: string;
    }): Promise<ApprovalRequest | null> {
      return client.approvalRequest.findFirst({
        where: {
          id: input.id,
          tenantId: input.tenantId,
        },
      });
    },
    listPendingForTenant(
      input: ListPendingApprovalRequestsInput,
    ): Promise<ApprovalRequest[]> {
      return client.approvalRequest.findMany({
        where: {
          tenantId: input.tenantId,
          status: "PENDING",
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: input.take,
      });
    },
    async findOrCreateForRun(
      input: TenantScopedRunInput,
    ): Promise<ApprovalRequest | null> {
      const existing = await findForRun(input);

      if (existing !== null) {
        return existing;
      }

      const run = await runs.findById({
        tenantId: input.tenantId,
        id: input.governedRunId,
      });

      if (run === null || run.currentState !== "WAITING_APPROVAL") {
        return null;
      }

      const admissionDecision = await admissions.findLatestForRun(input);

      if (admissionDecision === null) {
        return null;
      }

      const { approverRef } = getMyceliaDemoDatabaseConfig();

      return client.approvalRequest.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
          admissionDecisionRecordId: admissionDecision.id,
          status: "PENDING",
          // The local demo has one configured approver, so the same safe ref
          // represents the requested role and the eventual approver.
          requestedRole: approverRef,
          requesterRef: run.requesterRef,
        },
      });
    },
    async updateDecision(
      input: UpdateApprovalRequestDecisionInput,
    ): Promise<ApprovalRequest> {
      const update = await client.approvalRequest.updateMany({
        where: {
          id: input.id,
          tenantId: input.tenantId,
          status: "PENDING",
        },
        data: {
          status: input.status,
          decisionOutcome: input.decisionOutcome,
          decisionReasonCode: input.decisionReasonCode,
          safeDecisionSummary: input.safeDecisionSummary,
          approverRef: input.approverRef,
          decidedAt: input.decidedAt,
        },
      });

      if (update.count !== 1) {
        throw new Error("Approval request decision update failed closed.");
      }

      const record = await client.approvalRequest.findFirst({
        where: {
          id: input.id,
          tenantId: input.tenantId,
        },
      });

      if (record === null) {
        throw new Error("Approval request decision update did not return a record.");
      }

      return record;
    },
    countForRun(input: TenantScopedRunInput): Promise<number> {
      return client.approvalRequest.count({
        where: {
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
        },
      });
    },
    countPendingForTenant(input: { readonly tenantId: string }): Promise<number> {
      return client.approvalRequest.count({
        where: {
          tenantId: input.tenantId,
          status: "PENDING",
        },
      });
    },
  };
}
