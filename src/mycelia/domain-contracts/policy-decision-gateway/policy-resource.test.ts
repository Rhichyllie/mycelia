import { describe, expect, it } from "vitest";

import { PolicyResourceDescriptorSchema } from "./policy-resource";

describe("PolicyResourceDescriptorSchema", () => {
  it("supports tenant, workspace, and project scoped resource descriptors", () => {
    expect(
      PolicyResourceDescriptorSchema.safeParse({
        resource_type: "runtime.run",
        scope: "TENANT",
        tenant_id: "tenant_policy_01",
      }).success,
    ).toBe(true);

    expect(
      PolicyResourceDescriptorSchema.safeParse({
        resource_type: "workflow.version",
        scope: "WORKSPACE",
        tenant_id: "tenant_policy_01",
        workspace_id: "workspace_policy_01",
      }).success,
    ).toBe(true);

    expect(
      PolicyResourceDescriptorSchema.safeParse({
        resource_type: "tool.invocation",
        scope: "PROJECT",
        tenant_id: "tenant_policy_01",
        workspace_id: "workspace_policy_01",
        project_id: "project_policy_01",
      }).success,
    ).toBe(true);
  });

  it("requires tenant_id for all resource descriptors", () => {
    expect(
      PolicyResourceDescriptorSchema.safeParse({
        resource_type: "runtime.run",
        scope: "TENANT",
      }).success,
    ).toBe(false);
  });

  it("requires workspace_id for project scoped resources", () => {
    expect(
      PolicyResourceDescriptorSchema.safeParse({
        resource_type: "tool.invocation",
        scope: "PROJECT",
        tenant_id: "tenant_policy_01",
        project_id: "project_policy_01",
      }).success,
    ).toBe(false);
  });

  it("does not infer tenant, workspace, or project from names, URLs, paths, domains, or prefixes", () => {
    expect(
      PolicyResourceDescriptorSchema.safeParse({
        resource_type: "tenant.name",
        resource_id: "Acme Corporation",
        scope: "TENANT",
        tenant_id: "tenant_policy_01",
      }).success,
    ).toBe(false);

    expect(
      PolicyResourceDescriptorSchema.safeParse({
        resource_type: "runtime.run",
        resource_id: "https://tenant.example.com/resource",
        scope: "TENANT",
        tenant_id: "tenant_policy_01",
      }).success,
    ).toBe(false);
  });
});
