import { describe, expect, it } from "vitest";

import { err, isErr, isOk, ok } from "./result";

describe("Result helpers", () => {
  it("creates and narrows Ok results", () => {
    const result = ok({ value: 1 });

    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);

    if (isOk(result)) {
      expect(result.value.value).toBe(1);
    }
  });

  it("creates and narrows Err results", () => {
    const result = err({ code: "TEST_ERROR" });

    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);

    if (isErr(result)) {
      expect(result.error.code).toBe("TEST_ERROR");
    }
  });
});
