import { describe, expect, it } from "vitest";

import { EventNameSchema } from "./event-name";

describe("EventNameSchema", () => {
  it("accepts safe dotted canonical event names without defining a catalog", () => {
    expect(EventNameSchema.safeParse("Policy.DecisionRecorded").success).toBe(
      true,
    );
  });

  it("rejects free text and sensitive event names", () => {
    expect(EventNameSchema.safeParse("runtime run requested").success).toBe(
      false,
    );
    expect(EventNameSchema.safeParse("Runtime.secret-token").success).toBe(
      false,
    );
    expect(EventNameSchema.safeParse("Runtime.person@example.com").success).toBe(
      false,
    );
  });
});
