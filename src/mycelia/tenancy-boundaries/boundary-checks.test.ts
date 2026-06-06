import { describe, expect, it } from "vitest";

import {
  CorrelationIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
  ProjectIdSchema,
  isErr,
  isOk,
  type TenantId,
} from "../shared-kernel";

import {
  assertSameTenant,
  assertSameWorkspace,
  isSameProject,
  isSameTenant,
  isSameWorkspace,
  isWithinTenant,
  isWithinWorkspace,
  type BoundaryScopeLike,
} from "./boundary-checks";
import { createBoundaryDenial } from "./boundary-denial";

const tenantA = TenantIdSchema.parse("tenant-01HZ00000000000000A");
const tenantB = TenantIdSchema.parse("tenant-01HZ00000000000000B");
const workspaceA = WorkspaceIdSchema.parse("workspace-01HZ000000000000A");
const workspaceB = WorkspaceIdSchema.parse("workspace-01HZ000000000000B");
const projectA = ProjectIdSchema.parse("project-01HZ00000000000000A");
const projectB = ProjectIdSchema.parse("project-01HZ00000000000000B");

const tenantScopeA = { tenant_id: tenantA } as const;
const workspaceScopeA = {
  tenant_id: tenantA,
  workspace_id: workspaceA,
} as const;
const projectScopeA = {
  tenant_id: tenantA,
  workspace_id: workspaceA,
  project_id: projectA,
} as const;

describe("boundary checks", () => {
  it("same tenant check passes for the same tenant", () => {
    expect(isSameTenant(tenantScopeA, workspaceScopeA)).toBe(true);
    expect(isWithinTenant(projectScopeA, tenantScopeA)).toBe(true);
    expect(isOk(assertSameTenant(tenantScopeA, projectScopeA))).toBe(true);
  });

  it("same tenant check fails for different tenants", () => {
    const foreignScope = { tenant_id: tenantB };
    const result = assertSameTenant(tenantScopeA, foreignScope);

    expect(isSameTenant(tenantScopeA, foreignScope)).toBe(false);
    expect(isErr(result)).toBe(true);

    if (isErr(result)) {
      expect(result.error.code).toBe("CROSS_TENANT_ACCESS_DENIED");
    }
  });

  it("same workspace check requires same tenant and workspace", () => {
    expect(isSameWorkspace(workspaceScopeA, projectScopeA)).toBe(true);
    expect(isWithinWorkspace(projectScopeA, workspaceScopeA)).toBe(true);
    expect(isOk(assertSameWorkspace(workspaceScopeA, projectScopeA))).toBe(true);

    expect(
      isSameWorkspace(workspaceScopeA, {
        tenant_id: tenantA,
        workspace_id: workspaceB,
      }),
    ).toBe(false);
    expect(
      isSameWorkspace(workspaceScopeA, {
        tenant_id: tenantB,
        workspace_id: workspaceA,
      }),
    ).toBe(false);
  });

  it("same project check requires same tenant, workspace, and project", () => {
    expect(isSameProject(projectScopeA, { ...projectScopeA })).toBe(true);
    expect(
      isSameProject(projectScopeA, {
        tenant_id: tenantA,
        workspace_id: workspaceA,
        project_id: projectB,
      }),
    ).toBe(false);
    expect(
      isSameProject(projectScopeA, {
        tenant_id: tenantA,
        workspace_id: workspaceB,
        project_id: projectA,
      }),
    ).toBe(false);
    expect(
      isSameProject(projectScopeA, {
        tenant_id: tenantB,
        workspace_id: workspaceA,
        project_id: projectA,
      }),
    ).toBe(false);
  });

  it("fails closed when required scope is missing", () => {
    const missingTenant = {};
    const missingWorkspace = { tenant_id: tenantA };

    expect(isSameTenant(undefined, tenantScopeA)).toBe(false);
    expect(isSameWorkspace(missingWorkspace, workspaceScopeA)).toBe(false);

    const tenantResult = assertSameTenant(missingTenant, tenantScopeA);
    const workspaceResult = assertSameWorkspace(missingWorkspace, workspaceScopeA);

    expect(isErr(tenantResult)).toBe(true);
    expect(isErr(workspaceResult)).toBe(true);

    if (isErr(tenantResult)) {
      expect(tenantResult.error.code).toBe("TENANT_SCOPE_REQUIRED");
    }
    if (isErr(workspaceResult)) {
      expect(workspaceResult.error.code).toBe("WORKSPACE_SCOPE_REQUIRED");
    }
  });

  it("does not infer tenant from email, domain, or prefix-like strings", () => {
    const emailLikeTenant = "tenant-a@example.com" as unknown as TenantId;
    const domainLikeTenant = "tenant-a.example.com" as unknown as TenantId;
    const prefixedTenant = "tenant-01HZ00000000000000A-extra" as TenantId;

    const emailLikeScope: BoundaryScopeLike = { tenant_id: emailLikeTenant };
    const domainLikeScope: BoundaryScopeLike = { tenant_id: domainLikeTenant };
    const prefixedScope: BoundaryScopeLike = { tenant_id: prefixedTenant };

    expect(isSameTenant(emailLikeScope, tenantScopeA)).toBe(false);
    expect(isSameTenant(domainLikeScope, tenantScopeA)).toBe(false);
    expect(isSameTenant(prefixedScope, tenantScopeA)).toBe(false);
  });

  it("cross-tenant denial does not reveal foreign tenant IDs or names", () => {
    const denial = createBoundaryDenial({
      code: "CROSS_TENANT_ACCESS_DENIED",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant-01HZ00000000000000B");
    expect(serialized).not.toContain("Acme");
    expect(denial.message).toBe(
      "The requested resource is outside the allowed boundary.",
    );
  });

  it("denial supports correlation_id safely", () => {
    const correlationId = CorrelationIdSchema.parse(
      "corr-01HZ000000000000000",
    );
    const denial = createBoundaryDenial({
      code: "CROSS_WORKSPACE_ACCESS_DENIED",
      correlation_id: correlationId,
    });

    expect(denial.correlation_id).toBe(correlationId);
    expect(JSON.stringify(denial)).not.toContain("workspace-foreign-name");
  });
});
