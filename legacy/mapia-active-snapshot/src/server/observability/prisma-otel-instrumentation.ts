import type { PrismaClient } from "@prisma/client";

export type AttachPrismaTelemetryInstrumentationResult = {
  attached: false;
  reason: "observability_minimal";
};

export function attachOpenTelemetryPrismaInstrumentation(
  _prismaClient: PrismaClient,
): AttachPrismaTelemetryInstrumentationResult {
  void _prismaClient;
  return { attached: false, reason: "observability_minimal" };
}
