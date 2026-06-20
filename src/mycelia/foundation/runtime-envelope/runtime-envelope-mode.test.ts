import { describe, expect, it } from "vitest";

import {
  isNonProductionRuntimeEnvelopeMode,
  isProductionRuntimeEnvelopeMode,
  isReplayRuntimeEnvelopeMode,
} from "./runtime-envelope-mode";

describe("runtime envelope mode helpers", () => {
  it("treats PRODUCTION as the only production mode", () => {
    expect(isProductionRuntimeEnvelopeMode("PRODUCTION")).toBe(true);
    expect(isProductionRuntimeEnvelopeMode("REPLAY")).toBe(false);
    expect(isProductionRuntimeEnvelopeMode("EVALUATION")).toBe(false);
    expect(isProductionRuntimeEnvelopeMode("TEST")).toBe(false);
    expect(isProductionRuntimeEnvelopeMode("INVESTIGATION")).toBe(false);
  });

  it("treats replay, evaluation, test, and investigation as non-production", () => {
    expect(isReplayRuntimeEnvelopeMode("REPLAY")).toBe(true);
    expect(isNonProductionRuntimeEnvelopeMode("REPLAY")).toBe(true);
    expect(isNonProductionRuntimeEnvelopeMode("EVALUATION")).toBe(true);
    expect(isNonProductionRuntimeEnvelopeMode("TEST")).toBe(true);
    expect(isNonProductionRuntimeEnvelopeMode("INVESTIGATION")).toBe(true);
  });
});
