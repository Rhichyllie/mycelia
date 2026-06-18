import type { PolicyDecisionRecord, PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";

export type PrismaPolicyRepositoryClient = Pick<
  PrismaClient,
  "policyDecisionRecord"
>;

export type CreatePolicyDecisionRecordInput = {
  readonly id: string;
  readonly tenantId: string;
  readonly governedRunId: string;
  readonly riskLevel: string;
  readonly outcome: string;
  readonly reasonCode: string;
  readonly safeSummary: string;
  readonly policyRef: string;
};

export function createPrismaPolicyRepository(
  client: PrismaPolicyRepositoryClient = prisma,
) {
  return {
    create(input: CreatePolicyDecisionRecordInput): Promise<PolicyDecisionRecord> {
      return client.policyDecisionRecord.create({
        data: {
          id: input.id,
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
          riskLevel: input.riskLevel,
          outcome: input.outcome,
          reasonCode: input.reasonCode,
          safeSummary: input.safeSummary,
          policyRef: input.policyRef,
        },
      });
    },
    listForRun(input: {
      readonly tenantId: string;
      readonly governedRunId: string;
    }): Promise<PolicyDecisionRecord[]> {
      return client.policyDecisionRecord.findMany({
        where: {
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
        },
        orderBy: { createdAt: "asc" },
      });
    },
  };
}
