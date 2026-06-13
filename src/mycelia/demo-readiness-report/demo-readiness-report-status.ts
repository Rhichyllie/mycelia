import { z } from "zod";

export const DemoReadinessReportStatuses = [
  "READY",
  "NOT_READY",
  "NEEDS_REVIEW",
] as const;

export type DemoReadinessReportStatus =
  (typeof DemoReadinessReportStatuses)[number];

export const DemoReadinessReportStatusSchema = z.enum(
  DemoReadinessReportStatuses,
);
