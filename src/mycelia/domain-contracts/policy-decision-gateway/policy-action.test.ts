import { describe, expect, it } from "vitest";

import { PolicyActionSchema } from "./policy-action";

describe("PolicyActionSchema", () => {
  it("accepts safe non-empty dotted actions without defining a catalog", () => {
    expect(PolicyActionSchema.safeParse("runtime.run.start").success).toBe(
      true,
    );
    expect(PolicyActionSchema.safeParse("tool.invoke.request").success).toBe(
      true,
    );
    expect(PolicyActionSchema.safeParse("memory.read.request").success).toBe(
      true,
    );
  });

  it("rejects unsafe, empty, wildcard-only, URL, path, email, and shell-like actions", () => {
    const unsafeActions = [
      "",
      "*",
      "runtime run start",
      "runtime/run/start",
      "runtime\\run\\start",
      "https://example.com/action",
      "runtime.person@example.com",
      "runtime.run;rm",
      "runtime.run|start",
      "runtime.run$(start)",
    ];

    for (const action of unsafeActions) {
      expect(PolicyActionSchema.safeParse(action).success).toBe(false);
    }
  });
});
