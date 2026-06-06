import {
  err,
  ok,
  type ProjectId,
  type Result,
  type TenantId,
  type WorkspaceId,
} from "../shared-kernel";

import {
  createBoundaryDenial,
  type BoundaryDenial,
} from "./boundary-denial";

export type BoundaryScopeLike =
  | {
      readonly tenant_id?: TenantId;
      readonly workspace_id?: WorkspaceId;
      readonly project_id?: ProjectId;
    }
  | null
  | undefined;

function hasTenantScope(scope: BoundaryScopeLike): scope is {
  readonly tenant_id: TenantId;
  readonly workspace_id?: WorkspaceId;
  readonly project_id?: ProjectId;
} {
  return scope?.tenant_id !== undefined;
}

function hasWorkspaceScope(scope: BoundaryScopeLike): scope is {
  readonly tenant_id: TenantId;
  readonly workspace_id: WorkspaceId;
  readonly project_id?: ProjectId;
} {
  return hasTenantScope(scope) && scope.workspace_id !== undefined;
}

function hasProjectScope(scope: BoundaryScopeLike): scope is {
  readonly tenant_id: TenantId;
  readonly workspace_id: WorkspaceId;
  readonly project_id: ProjectId;
} {
  return hasWorkspaceScope(scope) && scope.project_id !== undefined;
}

export function isSameTenant(
  left: BoundaryScopeLike,
  right: BoundaryScopeLike,
): boolean {
  return (
    hasTenantScope(left) &&
    hasTenantScope(right) &&
    left.tenant_id === right.tenant_id
  );
}

export function isSameWorkspace(
  left: BoundaryScopeLike,
  right: BoundaryScopeLike,
): boolean {
  return (
    isSameTenant(left, right) &&
    hasWorkspaceScope(left) &&
    hasWorkspaceScope(right) &&
    left.workspace_id === right.workspace_id
  );
}

export function isSameProject(
  left: BoundaryScopeLike,
  right: BoundaryScopeLike,
): boolean {
  return (
    isSameWorkspace(left, right) &&
    hasProjectScope(left) &&
    hasProjectScope(right) &&
    left.project_id === right.project_id
  );
}

export function isWithinTenant(
  candidate: BoundaryScopeLike,
  tenantScope: BoundaryScopeLike,
): boolean {
  return isSameTenant(candidate, tenantScope);
}

export function isWithinWorkspace(
  candidate: BoundaryScopeLike,
  workspaceScope: BoundaryScopeLike,
): boolean {
  return isSameWorkspace(candidate, workspaceScope);
}

export function assertSameTenant(
  left: BoundaryScopeLike,
  right: BoundaryScopeLike,
): Result<true, BoundaryDenial> {
  if (!hasTenantScope(left) || !hasTenantScope(right)) {
    return err(createBoundaryDenial({ code: "TENANT_SCOPE_REQUIRED" }));
  }

  if (!isSameTenant(left, right)) {
    return err(createBoundaryDenial({ code: "CROSS_TENANT_ACCESS_DENIED" }));
  }

  return ok(true);
}

export function assertSameWorkspace(
  left: BoundaryScopeLike,
  right: BoundaryScopeLike,
): Result<true, BoundaryDenial> {
  if (!hasTenantScope(left) || !hasTenantScope(right)) {
    return err(createBoundaryDenial({ code: "TENANT_SCOPE_REQUIRED" }));
  }

  if (!isSameTenant(left, right)) {
    return err(createBoundaryDenial({ code: "CROSS_TENANT_ACCESS_DENIED" }));
  }

  if (!hasWorkspaceScope(left) || !hasWorkspaceScope(right)) {
    return err(createBoundaryDenial({ code: "WORKSPACE_SCOPE_REQUIRED" }));
  }

  if (!isSameWorkspace(left, right)) {
    return err(createBoundaryDenial({ code: "CROSS_WORKSPACE_ACCESS_DENIED" }));
  }

  return ok(true);
}
