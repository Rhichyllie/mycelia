import { z } from "zod";

export const AuditRecordKinds = [
  "POLICY_DECISION",
  "RUNTIME_ADMISSION",
  "GOVERNED_RUN",
  "RUNTIME_STATE",
  "STATE_TRANSITION",
  "STATE_TRANSITION_COORDINATION",
  "SECURITY_BOUNDARY",
  "TENANT_BOUNDARY",
  "SYSTEM_VALIDATION",
] as const;

export type AuditRecordKind = (typeof AuditRecordKinds)[number];

export const AuditRecordKindSchema = z.enum(AuditRecordKinds);
