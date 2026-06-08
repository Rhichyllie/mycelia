import { z } from "zod";

export const RuntimeStateKinds = [
  "CREATED",
  "ADMITTED",
  "REJECTED",
  "CANCELLED",
] as const;

export type RuntimeStateKind = (typeof RuntimeStateKinds)[number];

export const RuntimeStateKindSchema = z.enum(RuntimeStateKinds);

export function isCreatedRuntimeStateKind(kind: RuntimeStateKind): boolean {
  return kind === "CREATED";
}

export function isAdmittedRuntimeStateKind(kind: RuntimeStateKind): boolean {
  return kind === "ADMITTED";
}

export function isRejectedRuntimeStateKind(kind: RuntimeStateKind): boolean {
  return kind === "REJECTED";
}

export function isCancelledRuntimeStateKind(kind: RuntimeStateKind): boolean {
  return kind === "CANCELLED";
}
