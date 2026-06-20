import type { AuditRecord, PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";

export type PrismaAuditRepositoryClient = Pick<PrismaClient, "auditRecord">;

export type CreateAuditRecordInput = {
  readonly id: string;
  readonly tenantId: string;
  readonly governedRunId: string;
  readonly moment: string;
  readonly requirement: string;
  readonly recordKindHint: string;
  readonly reasonCode: string;
  readonly safeSummary: string;
  readonly subjectRef: string;
  readonly actorRef?: string;
  readonly evidenceRef?: string;
};

export function createPrismaAuditRepository(
  client: PrismaAuditRepositoryClient = prisma,
) {
  return {
    create(input: CreateAuditRecordInput): Promise<AuditRecord> {
      return client.auditRecord.create({
        data: {
          id: input.id,
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
          moment: input.moment,
          requirement: input.requirement,
          recordKindHint: input.recordKindHint,
          reasonCode: input.reasonCode,
          safeSummary: input.safeSummary,
          subjectRef: input.subjectRef,
          actorRef: input.actorRef,
          evidenceRef: input.evidenceRef,
        },
      });
    },
    listForRun(input: {
      readonly tenantId: string;
      readonly governedRunId: string;
    }): Promise<AuditRecord[]> {
      return client.auditRecord.findMany({
        where: {
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
        },
        orderBy: { createdAt: "asc" },
      });
    },
    countForRun(input: {
      readonly tenantId: string;
      readonly governedRunId: string;
    }): Promise<number> {
      return client.auditRecord.count({
        where: {
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
        },
      });
    },
  };
}