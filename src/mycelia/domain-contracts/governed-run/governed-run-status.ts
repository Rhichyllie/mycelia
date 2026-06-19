import { z } from "zod";

export const GovernedRunStatuses = [
  "CREATED",
  "ADMITTED",
  "REJECTED",
  "CANCELLED",
] as const;

export type GovernedRunStatus = (typeof GovernedRunStatuses)[number];

export const GovernedRunStatusSchema = z.enum(GovernedRunStatuses);

export function isCreatedGovernedRunStatus(
  status: GovernedRunStatus,
): boolean {
  return status === "CREATED";
}

export function isAdmittedGovernedRunStatus(
  status: GovernedRunStatus,
): boolean {
  return status === "ADMITTED";
}

export function isRejectedGovernedRunStatus(
  status: GovernedRunStatus,
): boolean {
  return status === "REJECTED";
}

export function isCancelledGovernedRunStatus(
  status: GovernedRunStatus,
): boolean {
  return status === "CANCELLED";
}
