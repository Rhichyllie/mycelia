"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import { resetDemoDatabase, type ResetDemoDatabaseResult } from "@/mycelia/runtime/demo-reset";
import {
  createGovernedRequest as createGovernedRequestWritePath,
  type CreateGovernedRequestResult,
} from "@/mycelia/runtime/governed-request/create-governed-request";

export type ResetDemoActionResult =
  | ResetDemoDatabaseResult
  | {
      readonly ok: false;
      readonly status: "DEMO_MODE_DISABLED";
      readonly safeReason: string;
    };

function revalidateDemoSurfaces(): void {
  revalidatePath("/mycelia/demo");
  revalidatePath("/mycelia/approval/decision");
  revalidatePath("/mycelia/investigation");
}

export async function createGovernedRequest(
  formData: FormData,
): Promise<void>;
export async function createGovernedRequest(): Promise<CreateGovernedRequestResult>;
export async function createGovernedRequest(
  formData?: FormData,
): Promise<CreateGovernedRequestResult | void> {
  const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
  const result = await createGovernedRequestWritePath({ client: prisma, tenantId });

  revalidatePath("/mycelia/demo");

  if (formData instanceof FormData) {
    return;
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

  revalidateDemoSurfaces();

  if (formData instanceof FormData) {
    return;
  }

  return result;
}
