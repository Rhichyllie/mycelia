import { describe, expect, it } from "vitest";

import { createRuntimeEnvelopeDenial } from "./runtime-envelope-denial";

describe("runtime envelope denial", () => {
  it("uses safe non-enumerating denial messages", () => {
    const denial = createRuntimeEnvelopeDenial({
      code: "INVALID_RUNTIME_ENVELOPE_SCOPE",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_runtime_01");
    expect(serialized).not.toContain("workspace_runtime_01");
    expect(serialized).not.toContain("project_runtime_01");
    expect(serialized).not.toContain("policy_decision_runtime_01");
    expect(serialized).not.toContain("actor_runtime_01");
    expect(serialized).not.toContain("request_runtime_01");
    expect(serialized).not.toContain("event_runtime_01");
    expect(serialized).not.toContain("Acme Corporation");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("token");
  });
});
