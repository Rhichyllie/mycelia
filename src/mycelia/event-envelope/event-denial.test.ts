import { describe, expect, it } from "vitest";

import { createEventEnvelopeDenial } from "./event-denial";

describe("event envelope denial", () => {
  it("does not reveal tenant IDs, workspace IDs, project IDs, emails, display names, raw metadata, or raw payload", () => {
    const denial = createEventEnvelopeDenial({
      code: "INVALID_EVENT_SCOPE",
    });

    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_01");
    expect(serialized).not.toContain("workspace_01");
    expect(serialized).not.toContain("project_01");
    expect(serialized).not.toContain("person@example.com");
    expect(serialized).not.toContain("Acme Corporation");
    expect(serialized).not.toContain("raw_prompt");
    expect(serialized).not.toContain("raw payload");
    expect(serialized).not.toContain("secret token");
  });
});
