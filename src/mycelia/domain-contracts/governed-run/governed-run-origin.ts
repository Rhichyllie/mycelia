import { z } from "zod";

export const GovernedRunOrigins = [
  "REQUEST_ENVELOPE",
  "RUNTIME_ADMISSION",
  "REPLAY",
  "TEST",
] as const;

export type GovernedRunOrigin = (typeof GovernedRunOrigins)[number];

export const GovernedRunOriginSchema = z.enum(GovernedRunOrigins);
