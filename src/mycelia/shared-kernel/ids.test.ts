import { describe, expect, it } from "vitest";

import { CanonicalIdSchemas } from "./ids";

describe("canonical ID schemas", () => {
  it("reject empty strings", () => {
    for (const [name, schema] of Object.entries(CanonicalIdSchemas)) {
      expect(schema.safeParse("").success, name).toBe(false);
    }
  });

  it("accept opaque non-empty strings", () => {
    for (const [name, schema] of Object.entries(CanonicalIdSchemas)) {
      expect(schema.safeParse(`opaque-${name}-01HZ000000000000000`).success).toBe(
        true,
      );
    }
  });

  it("reject email-like identifiers", () => {
    expect(CanonicalIdSchemas.TenantId.safeParse("tenant@example.com").success).toBe(
      false,
    );
  });
});
