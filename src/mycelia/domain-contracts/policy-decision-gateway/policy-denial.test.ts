import { describe, expect, it } from "vitest";

import { createPolicyDenial } from "./policy-denial";

describe("policy denial", () => {
  it("uses safe non-enumerating denial messages", () => {
    const denial = createPolicyDenial({
      code: "POLICY_DECISION_NOT_ALLOWED",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_policy_01");
    expect(serialized).not.toContain("workspace_policy_01");
    expect(serialized).not.toContain("project_policy_01");
    expect(serialized).not.toContain("admin");
    expect(serialized).not.toContain("tool.invoke.request");
    expect(serialized).not.toContain("Acme Corporation");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("token");
  });
});
