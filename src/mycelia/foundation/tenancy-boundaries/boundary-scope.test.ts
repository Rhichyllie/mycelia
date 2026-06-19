import { describe, expect, it } from "vitest";

import {
  OrganizationalScopeSchema,
  ProjectScopeSchema,
  TenantScopeSchema,
  WorkspaceScopeSchema,
} from "./boundary-scope";

describe("boundary scope schemas", () => {
  it("requires tenant_id for all scopes", () => {
    expect(TenantScopeSchema.safeParse({}).success).toBe(false);
    expect(
      WorkspaceScopeSchema.safeParse({ workspace_id: "workspace-a" }).success,
    ).toBe(false);
    expect(
      ProjectScopeSchema.safeParse({
        workspace_id: "workspace-a",
        project_id: "project-a",
      }).success,
    ).toBe(false);
  });

  it("accepts tenant, workspace, and project scopes with opaque IDs", () => {
    expect(
      TenantScopeSchema.safeParse({ tenant_id: "tenant-01HZ000000000000000" })
        .success,
    ).toBe(true);
    expect(
      WorkspaceScopeSchema.safeParse({
        tenant_id: "tenant-01HZ000000000000000",
        workspace_id: "workspace-01HZ000000000000000",
      }).success,
    ).toBe(true);
    expect(
      ProjectScopeSchema.safeParse({
        tenant_id: "tenant-01HZ000000000000000",
        workspace_id: "workspace-01HZ000000000000000",
        project_id: "project-01HZ000000000000000",
      }).success,
    ).toBe(true);
  });

  it("rejects project_id without workspace_id", () => {
    expect(
      OrganizationalScopeSchema.safeParse({
        tenant_id: "tenant-01HZ000000000000000",
        project_id: "project-01HZ000000000000000",
      }).success,
    ).toBe(false);
  });

  it("rejects workspace_id without tenant_id", () => {
    expect(
      OrganizationalScopeSchema.safeParse({
        workspace_id: "workspace-01HZ000000000000000",
      }).success,
    ).toBe(false);
  });
});
