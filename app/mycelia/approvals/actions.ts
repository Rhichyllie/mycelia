"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import {
  decideApprovalRequest,
  type ApprovalDecisionOutcome,
  type DecideApprovalRequestResult,
} from "@/mycelia/runtime/governed-request/decide-approval-request";
import { createPrismaDemoReadRepository } from "@/mycelia/runtime/repositories/prisma-demo-read.repository";
import { buildLiveOutcomeRedirectPath } from "@/mycelia/runtime/ui/format-live-label";

function noWaitingRunFailure(): DecideApprovalRequestResult {
  return {
    ok: false,
    status: "FAILED_SAFE",
    reasonCode: "NO_WAITING_APPROVAL_RUN",
    safeReason: "No governed request is currently waiting for approval.",
  };
}

async function decideLatestWaitingApprovalRun(
  decision: ApprovalDecisionOutcome,
): Promise<DecideApprovalRequestResult> {
  const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
  const repository = createPrismaDemoReadRepository(prisma);
  const waitingRun = await repository.findLatestWaitingApprovalRun({ tenantId });

  if (waitingRun === null) {
    return noWaitingRunFailure();
  }

  return decideApprovalRequest({
    client: prisma,
    tenantId,
    runId: waitingRun.run.id,
    decision,
  });
}

export async function approveGovernedRequest(
  formData: FormData,
): Promise<void>;
export async function approveGovernedRequest(): Promise<DecideApprovalRequestResult>;
export async function approveGovernedRequest(
  formData?: FormData,
): Promise<DecideApprovalRequestResult | void> {
  // The demo resolves the current waiting run on the server instead of trusting form input.
  const result = await decideLatestWaitingApprovalRun("APPROVE");

  if (!result.ok) {
    if (formData instanceof FormData) {
      redirect(
        buildLiveOutcomeRedirectPath("/mycelia/approvals", result),
      );
    }

    return result;
  }

  revalidatePath("/mycelia/approvals");

  if (formData instanceof FormData) {
    return;
  }

  return result;
}

export async function rejectGovernedRequest(
  formData: FormData,
): Promise<void>;
export async function rejectGovernedRequest(): Promise<DecideApprovalRequestResult>;
export async function rejectGovernedRequest(
  formData?: FormData,
): Promise<DecideApprovalRequestResult | void> {
  // The demo resolves the current waiting run on the server instead of trusting form input.
  const result = await decideLatestWaitingApprovalRun("REJECT");

  if (!result.ok) {
    if (formData instanceof FormData) {
      redirect(
        buildLiveOutcomeRedirectPath("/mycelia/approvals", result),
      );
    }

    return result;
  }

  revalidatePath("/mycelia/approvals");

  if (formData instanceof FormData) {
    return;
  }

  return result;
}
