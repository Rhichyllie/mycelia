import type { AdmissionDecisionRecord, PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";

export type PrismaAdmissionRepositoryClient = Pick<
  PrismaClient,
  "admissionDecisionRecord"
>;

export type CreateAdmissionDecisionRecordInput = {
  readonly id: string;
  readonly tenantId: string;
  readonly governedRunId: string;
  readonly outcome: string;
  readonly reasonCode: string;
  readonly safeSummary: string;
  readonly lifecycleIntentHint: string;
};

export function createPrismaAdmissionRepository(
  client: PrismaAdmissionRepositoryClient = prisma,
) {
  return {
    createDecision(
      input: CreateAdmissionDecisionRecordInput,
    ): Promise<AdmissionDecisionRecord> {
      return client.admissionDecisionRecord.create({
        data: {
          id: input.id,
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
          outcome: input.outcome,
          reasonCode: input.reasonCode,
          safeSummary: input.safeSummary,
          lifecycleIntentHint: input.lifecycleIntentHint,
        },
      });
    },
    findLatestForRun(input: {
      readonly tenantId: string;
      readonly governedRunId: string;
    }): Promise<AdmissionDecisionRecord | null> {
      return client.admissionDecisionRecord.findFirst({
        where: {
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
        },
        orderBy: { createdAt: "desc" },
      });
    },
  };
}