import { describe, expect, it } from "vitest";

import { createSafeError } from "./errors";
import { CorrelationIdSchema } from "./ids";

describe("safe errors", () => {
  it("does not expose raw internal details by default", () => {
    const safe = createSafeError({ code: "INTERNAL_ERROR" });
    const serialized = JSON.stringify(safe);

    expect(safe.message).toBe("An internal MYCELIA error occurred.");
    expect(serialized).not.toContain("raw secret token payload");
    expect(serialized).not.toContain("unsafe internal details");
    expect(serialized).not.toContain("stack");
  });

  it("redacts unsafe caller-provided safe messages", () => {
    const safe = createSafeError({
      code: "VALIDATION_FAILED",
      safe_message: "invalid bearer token abc123",
    });

    expect(safe.message).toBe("The request failed validation.");
    expect(JSON.stringify(safe)).not.toContain("abc123");
  });

  it("supports correlation identifiers", () => {
    const correlationId = CorrelationIdSchema.parse("corr-01HZ000000000000000");
    const safe = createSafeError({
      code: "FORBIDDEN",
      correlation_id: correlationId,
    });

    expect(safe.correlation_id).toBe(correlationId);
  });
});
