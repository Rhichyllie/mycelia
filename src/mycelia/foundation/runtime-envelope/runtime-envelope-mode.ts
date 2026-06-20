import { z } from "zod";

export const RuntimeEnvelopeModes = [
  "PRODUCTION",
  "REPLAY",
  "EVALUATION",
  "TEST",
  "INVESTIGATION",
] as const;

export type RuntimeEnvelopeMode = (typeof RuntimeEnvelopeModes)[number];

export const RuntimeEnvelopeModeSchema = z.enum(RuntimeEnvelopeModes);

export function isProductionRuntimeEnvelopeMode(
  mode: RuntimeEnvelopeMode,
): boolean {
  return mode === "PRODUCTION";
}

export function isReplayRuntimeEnvelopeMode(
  mode: RuntimeEnvelopeMode,
): boolean {
  return mode === "REPLAY";
}

export function isNonProductionRuntimeEnvelopeMode(
  mode: RuntimeEnvelopeMode,
): boolean {
  return mode !== "PRODUCTION";
}
