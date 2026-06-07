import { describe, expect, it } from "vitest";

import { validateRuntimeEnvelopeScope } from "./runtime-envelope-checks";
import { RuntimeEnvelopeScopeSchema } from "./runtime-envelope-scope";

describe("RuntimeEnvelopeScopeSchema", () => {
  it("requires tenant_id", () => {
    expect(RuntimeEnvelopeScopeSchema.safeParse({}).success).toBe(false);
  });

  it("rejects project_id without workspace_id", () => {
    const result = validateRuntimeEnvelopeScope({
      tenant_id: "tenant_runtime_01",
      project_id: "project_runtime_01",
    });

    expect(result.ok).toBe(false);
  });

  it("accepts tenant, workspace, and project scope", () => {
    const result = validateRuntimeEnvelopeScope({
      tenant_id: "tenant_runtime_01",
      workspace_id: "workspace_runtime_01",
      project_id: "project_runtime_01",
    });

    expect(result.ok).toBe(true);
  });
});
