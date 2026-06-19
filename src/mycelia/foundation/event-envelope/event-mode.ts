import { z } from "zod";

export const EventModes = [
  "PRODUCTION",
  "REPLAY",
  "EVALUATION",
  "TEST",
  "INVESTIGATION",
] as const;

export type EventMode = (typeof EventModes)[number];

export const EventModeSchema = z.enum(EventModes);

export function isProductionEventMode(mode: EventMode): boolean {
  return mode === "PRODUCTION";
}

export function isReplayEventMode(mode: EventMode): boolean {
  return mode === "REPLAY";
}

export function isEvaluationEventMode(mode: EventMode): boolean {
  return mode === "EVALUATION";
}

export function isTestEventMode(mode: EventMode): boolean {
  return mode === "TEST";
}

export function isInvestigationEventMode(mode: EventMode): boolean {
  return mode === "INVESTIGATION";
}
