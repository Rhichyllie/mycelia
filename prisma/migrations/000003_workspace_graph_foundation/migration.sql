CREATE TABLE "workspaces" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "ownerIdentity" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "workspace_memberships" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "workspace_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "workspace_memberships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "projects" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "template" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "projects_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "nodes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "positionX" REAL NOT NULL,
  "positionY" REAL NOT NULL,
  "data" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "nodes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "edges" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "sourceNodeId" TEXT NOT NULL,
  "targetNodeId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "label" TEXT,
  "data" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "edges_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "edges_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "edges_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "external_refs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "nodeId" TEXT,
  "edgeId" TEXT,
  "system" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "locator" TEXT NOT NULL,
  "metadata" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "external_refs_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "edges" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "external_refs_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "external_refs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces" ("slug");

CREATE UNIQUE INDEX "workspace_memberships_workspaceId_userId_key" ON "workspace_memberships" ("workspaceId", "userId");
CREATE INDEX "workspace_memberships_userId_idx" ON "workspace_memberships" ("userId");
CREATE INDEX "workspace_memberships_workspaceId_role_idx" ON "workspace_memberships" ("workspaceId", "role");

CREATE UNIQUE INDEX "projects_workspaceId_slug_key" ON "projects" ("workspaceId", "slug");
CREATE INDEX "projects_workspaceId_idx" ON "projects" ("workspaceId");

CREATE INDEX "nodes_projectId_idx" ON "nodes" ("projectId");

CREATE INDEX "edges_projectId_idx" ON "edges" ("projectId");
CREATE INDEX "edges_sourceNodeId_idx" ON "edges" ("sourceNodeId");
CREATE INDEX "edges_targetNodeId_idx" ON "edges" ("targetNodeId");

CREATE UNIQUE INDEX "external_refs_projectId_system_externalId_nodeId_edgeId_key" ON "external_refs" ("projectId", "system", "externalId", "nodeId", "edgeId");
CREATE INDEX "external_refs_projectId_idx" ON "external_refs" ("projectId");
CREATE INDEX "external_refs_nodeId_idx" ON "external_refs" ("nodeId");
CREATE INDEX "external_refs_edgeId_idx" ON "external_refs" ("edgeId");