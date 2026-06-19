import { describe, expect, it } from "vitest";

import {
  isEvaluationEventMode,
  isInvestigationEventMode,
  isProductionEventMode,
  isReplayEventMode,
  isTestEventMode,
} from "./event-mode";

describe("event mode helpers", () => {
  it("classifies only PRODUCTION as production mode", () => {
    expect(isProductionEventMode("PRODUCTION")).toBe(true);
    expect(isProductionEventMode("REPLAY")).toBe(false);
    expect(isProductionEventMode("EVALUATION")).toBe(false);
    expect(isProductionEventMode("TEST")).toBe(false);
    expect(isProductionEventMode("INVESTIGATION")).toBe(false);
  });

  it("classifies non-production modes explicitly", () => {
    expect(isReplayEventMode("REPLAY")).toBe(true);
    expect(isEvaluationEventMode("EVALUATION")).toBe(true);
    expect(isTestEventMode("TEST")).toBe(true);
    expect(isInvestigationEventMode("INVESTIGATION")).toBe(true);
  });
});
