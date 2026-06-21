"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import { resetDemoDatabase, type ResetDemoDatabaseResult } from "@/mycelia/runtime/demo-reset";
import {
  findLiveDemoScenarioByKey,
  LIVE_DEMO_SCENARIO,
  type LiveDemoScenarioKey,
} from "@/mycelia/runtime/demo-scenario";
import {
  createGovernedRequest as createGovernedRequestWritePath,
  type CreateGovernedRequestResult,
} from "@/mycelia/runtime/governed-request/create-governed-request";
import { buildLiveOutcomeRedirectPath } from "@/mycelia/runtime/ui/format-live-label";

export type ResetDemoActionResult =
  | ResetDemoDatabaseResult
  | {
      readonly ok: false;
      readonly status: "DEMO_MODE_DISABLED";
      readonly safeReason: string;
    };

function revalidateDemoSurfaces(): void {
  revalidatePath("/mycelia");
  revalidatePath("/mycelia/runs");
  revalidatePath("/mycelia/approvals");
  revalidatePath("/mycelia/investigations");
}

function selectedScenarioKey(
  formData: FormData | undefined,
): LiveDemoScenarioKey | null {
  if (!(formData instanceof FormData)) {
    return LIVE_DEMO_SCENARIO.scenarioKey;
  }

  const rawValue = formData.get("scenarioKey");
  const scenario = findLiveDemoScenarioByKey(
    typeof rawValue === "string" ? rawValue : null,
  );

  return scenario?.scenarioKey ?? null;
}

export async function createGovernedRequest(
  formData: FormData,
): Promise<void>;
export async function createGovernedRequest(): Promise<CreateGovernedRequestResult>;
export async function createGovernedRequest(
  formData?: FormData,
): Promise<CreateGovernedRequestResult | void> {
  const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
  const scenarioKey = selectedScenarioKey(formData);
  const result: CreateGovernedRequestResult =
    scenarioKey === null
      ? {
          ok: false,
          status: "FAILED_SAFE",
          safeReason:
            "Selected fixture scenario was not recognized, so no run was created.",
        }
      : await createGovernedRequestWritePath({
          client: prisma,
          tenantId,
          scenarioKey,
        });

  if (!result.ok) {
    if (formData instanceof FormData) {
      redirect(buildLiveOutcomeRedirectPath("/mycelia/runs", result));
    }

    return result;
  }

  revalidateDemoSurfaces();

  if (formData instanceof FormData) {
    redirect(
      buildLiveOutcomeRedirectPath(`/mycelia/runs?runId=${result.runId}`, {
        status: "RUN_CREATED",
        reasonCode: result.admissionReasonCode,
      }),
    );
  }

  return result;
}

export async function resetDemo(formData: FormData): Promise<void>;
export async function resetDemo(): Promise<ResetDemoActionResult>;
export async function resetDemo(
  formData?: FormData,
): Promise<ResetDemoActionResult | void> {
  const config = getMyceliaDemoDatabaseConfig();
  const result: ResetDemoActionResult = config.demoMode
    ? await resetDemoDatabase({ client: prisma, tenantId: config.tenantId })
    : {
        ok: false,
        status: "DEMO_MODE_DISABLED",
        safeReason: "Demo reset is disabled outside demo mode.",
      };

  if (!result.ok) {
    if (formData instanceof FormData) {
      redirect(buildLiveOutcomeRedirectPath("/mycelia/runs", result));
    }

    return result;
  }

  revalidateDemoSurfaces();

  if (formData instanceof FormData) {
    return;
  }

  return result;
}
