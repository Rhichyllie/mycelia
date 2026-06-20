import type { PrismaClient } from "@prisma/client";

import { prisma } from "./db/client";
import { getMyceliaDemoDatabaseConfig } from "./db/demo-config";
import {
  seedDemoScenario,
  type SeedDemoScenarioResult,
} from "./demo-seed-scenario";

export type ResetDemoDatabaseSuccess = {
  readonly ok: true;
  readonly tenantId: string;
  readonly seed: SeedDemoScenarioResult;
};

export type ResetDemoDatabaseFailure = {
  readonly ok: false;
  readonly status: "FAILED_SAFE";
  readonly safeReason: string;
};

export type ResetDemoDatabaseResult =
  | ResetDemoDatabaseSuccess
  | ResetDemoDatabaseFailure;

export type ResetDemoDatabaseInput = {
  readonly client?: PrismaClient;
  readonly tenantId?: string;
};

export async function resetDemoDatabase(
  input: ResetDemoDatabaseInput = {},
): Promise<ResetDemoDatabaseResult> {
  const client = input.client ?? prisma;
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;

  try {
    return await client.$transaction(async (tx) => {
      await tx.auditRecord.deleteMany({ where: { tenantId } });
      await tx.approvalRequest.deleteMany({ where: { tenantId } });
      await tx.admissionDecisionRecord.deleteMany({ where: { tenantId } });
      await tx.policyDecisionRecord.deleteMany({ where: { tenantId } });
      await tx.runtimeStateSnapshot.deleteMany({ where: { tenantId } });
      await tx.governedRun.deleteMany({ where: { tenantId } });

      const seed = await seedDemoScenario({ client: tx, tenantId });

      return {
        ok: true,
        tenantId,
        seed,
      } satisfies ResetDemoDatabaseSuccess;
    });
  } catch {
    return {
      ok: false,
      status: "FAILED_SAFE",
      safeReason:
        "Demo database reset failed before restoring the seeded scenario.",
    };
  }
}
