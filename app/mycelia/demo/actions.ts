"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import {
  createGovernedRequest as createGovernedRequestWritePath,
  type CreateGovernedRequestResult,
} from "@/mycelia/runtime/governed-request/create-governed-request";

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