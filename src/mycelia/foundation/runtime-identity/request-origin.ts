import { z } from "zod";

export const RequestOrigins = [
  "HUMAN_UI",
  "SERVICE_INTERNAL",
  "SCHEDULED_JOB",
  "WEBHOOK",
  "EXTERNAL_API",
  "REPLAY",
  "TEST_RUN",
  "SYSTEM_MAINTENANCE",
] as const;

export type RequestOrigin = (typeof RequestOrigins)[number];

export const RequestOriginSchema = z.enum(RequestOrigins);
