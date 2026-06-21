"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import {
  decideApprovalRequest,
  type ApprovalDecisionOutcome,
  type DecideApprovalRequestFailure,
  type DecideApprovalRequestResult,
} from "@/mycelia/runtime/governed-request/decide-approval-request";
import { createPrismaApprovalRequestRepository } from "@/mycelia/runtime/repositories/prisma-approval-request.repository";
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

function approvalRequestNotPendingFailure(): DecideApprovalRequestResult {
  return {
    ok: false,
    status: "FAILED_SAFE",
    reasonCode: "APPROVAL_REQUEST_NOT_PENDING",
    safeReason: "Only pending approval requests may be decided.",
  };
}

function rationaleRequiredFailure(): DecideApprovalRequestResult {
  return {
    ok: false,
    status: "FAILED_SAFE",
    reasonCode: "APPROVAL_RATIONALE_REQUIRED",
    safeReason: "Rejecting an approval request requires a rationale.",
  };
}

function cleanText(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? undefined : trimmed;
}

function approvalOutcomePath(
  result: DecideApprovalRequestFailure,
  approvalId: string | undefined,
): string {
  const path = buildLiveOutcomeRedirectPath("/mycelia/approvals", result);

  if (approvalId === undefined) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}approvalId=${encodeURIComponent(approvalId)}`;
}

async function decideLatestWaitingApprovalRun(
  decision: ApprovalDecisionOutcome,
  safeDecisionSummary?: string,
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
    safeDecisionSummary,
  });
}

async function decideApprovalFromForm(
  decision: ApprovalDecisionOutcome,
  formData: FormData,
): Promise<DecideApprovalRequestResult> {
  const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
  const approvalId = cleanText(formData.get("approvalId"));
  const safeDecisionSummary = cleanText(formData.get("safeDecisionSummary"));

  if (decision === "REJECT" && safeDecisionSummary === undefined) {
    return rationaleRequiredFailure();
  }

  if (approvalId === undefined) {
    return decideLatestWaitingApprovalRun(decision, safeDecisionSummary);
  }

  const approvalRequest = await createPrismaApprovalRequestRepository(
    prisma,
  ).findById({ tenantId, id: approvalId });

  if (approvalRequest === null || approvalRequest.status !== "PENDING") {
    return approvalRequestNotPendingFailure();
  }

  return decideApprovalRequest({
    client: prisma,
    tenantId,
    runId: approvalRequest.governedRunId,
    decision,
    safeDecisionSummary,
  });
}

export async function approveGovernedRequest(
  formData: FormData,
): Promise<void>;
export async function approveGovernedRequest(): Promise<DecideApprovalRequestResult>;
export async function approveGovernedRequest(
  formData?: FormData,
): Promise<DecideApprovalRequestResult | void> {
  const result =
    formData instanceof FormData
      ? await decideApprovalFromForm("APPROVE", formData)
      : await decideLatestWaitingApprovalRun("APPROVE");

  if (!result.ok) {
    if (formData instanceof FormData) {
      redirect(
        approvalOutcomePath(result, cleanText(formData.get("approvalId"))),
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
  const result =
    formData instanceof FormData
      ? await decideApprovalFromForm("REJECT", formData)
      : await decideLatestWaitingApprovalRun("REJECT");

  if (!result.ok) {
    if (formData instanceof FormData) {
      redirect(
        approvalOutcomePath(result, cleanText(formData.get("approvalId"))),
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
