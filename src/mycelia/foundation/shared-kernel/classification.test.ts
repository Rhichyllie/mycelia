import { describe, expect, it } from "vitest";

import {
  compareClassification,
  highestClassification,
  isClassificationDowngrade,
  validateClassificationChange,
} from "./classification";
import { isErr, isOk } from "./result";

describe("data classification helpers", () => {
  it("orders classifications from public to secret", () => {
    expect(compareClassification("PUBLIC", "SECRET")).toBeLessThan(0);
    expect(compareClassification("SECRET", "PUBLIC")).toBeGreaterThan(0);
  });

  it("returns the highest classification across values", () => {
    expect(
      highestClassification("INTERNAL", "PUBLIC", "RESTRICTED", "CONFIDENTIAL"),
    ).toBe("RESTRICTED");
  });

  it("reports downgrades instead of allowing silent downgrade helper misuse", () => {
    expect(isClassificationDowngrade("RESTRICTED", "CONFIDENTIAL")).toBe(true);

    const rejected = validateClassificationChange(
      "RESTRICTED",
      "CONFIDENTIAL",
    );
    expect(isErr(rejected)).toBe(true);

    if (isErr(rejected)) {
      expect(rejected.error.code).toBe("CLASSIFICATION_DOWNGRADE");
    }
  });

  it("allows same-level or higher classification changes", () => {
    expect(isOk(validateClassificationChange("INTERNAL", "INTERNAL"))).toBe(
      true,
    );
    expect(isOk(validateClassificationChange("INTERNAL", "SECRET"))).toBe(true);
  });
});
