-- CreateTable
CREATE TABLE "GovernedRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "currentState" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resourceRef" TEXT NOT NULL,
    "requesterRef" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernedRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuntimeStateSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "governedRunId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeStateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDecisionRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "governedRunId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "policyRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyDecisionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionDecisionRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "governedRunId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "lifecycleIntentHint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionDecisionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "governedRunId" TEXT NOT NULL,
    "admissionDecisionRecordId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedRole" TEXT NOT NULL,
    "requesterRef" TEXT NOT NULL,
    "approverRef" TEXT,
    "decisionOutcome" TEXT,
    "decisionReasonCode" TEXT,
    "safeDecisionSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "governedRunId" TEXT NOT NULL,
    "moment" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "recordKindHint" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "subjectRef" TEXT NOT NULL,
    "actorRef" TEXT,
    "evidenceRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "displayName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "emailAtLogin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerIdentity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_memberships" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edges" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_refs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "nodeId" TEXT,
    "edgeId" TEXT,
    "system" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "locator" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_refs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GovernedRun_tenantId_idx" ON "GovernedRun"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GovernedRun_tenantId_correlationId_key" ON "GovernedRun"("tenantId", "correlationId");

-- CreateIndex
CREATE INDEX "RuntimeStateSnapshot_tenantId_idx" ON "RuntimeStateSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "RuntimeStateSnapshot_governedRunId_idx" ON "RuntimeStateSnapshot"("governedRunId");

-- CreateIndex
CREATE INDEX "PolicyDecisionRecord_tenantId_idx" ON "PolicyDecisionRecord"("tenantId");

-- CreateIndex
CREATE INDEX "PolicyDecisionRecord_governedRunId_idx" ON "PolicyDecisionRecord"("governedRunId");

-- CreateIndex
CREATE INDEX "AdmissionDecisionRecord_tenantId_idx" ON "AdmissionDecisionRecord"("tenantId");

-- CreateIndex
CREATE INDEX "AdmissionDecisionRecord_governedRunId_idx" ON "AdmissionDecisionRecord"("governedRunId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_tenantId_idx" ON "ApprovalRequest"("tenantId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_governedRunId_idx" ON "ApprovalRequest"("governedRunId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_admissionDecisionRecordId_idx" ON "ApprovalRequest"("admissionDecisionRecordId");

-- CreateIndex
CREATE INDEX "AuditRecord_tenantId_idx" ON "AuditRecord"("tenantId");

-- CreateIndex
CREATE INDEX "AuditRecord_governedRunId_idx" ON "AuditRecord"("governedRunId");

-- CreateIndex
CREATE INDEX "app_users_tenantId_idx" ON "app_users"("tenantId");

-- CreateIndex
CREATE INDEX "app_users_emailNormalized_idx" ON "app_users"("emailNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_tenantId_emailNormalized_key" ON "app_users"("tenantId", "emailNormalized");

-- CreateIndex
CREATE INDEX "auth_identities_userId_idx" ON "auth_identities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_providerId_subject_key" ON "auth_identities"("providerId", "subject");

-- CreateIndex
CREATE INDEX "workspaces_tenantId_idx" ON "workspaces"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_tenantId_slug_key" ON "workspaces"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "workspace_memberships_tenantId_idx" ON "workspace_memberships"("tenantId");

-- CreateIndex
CREATE INDEX "workspace_memberships_userId_idx" ON "workspace_memberships"("userId");

-- CreateIndex
CREATE INDEX "workspace_memberships_workspaceId_role_idx" ON "workspace_memberships"("workspaceId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_memberships_tenantId_workspaceId_userId_key" ON "workspace_memberships"("tenantId", "workspaceId", "userId");

-- CreateIndex
CREATE INDEX "projects_tenantId_idx" ON "projects"("tenantId");

-- CreateIndex
CREATE INDEX "projects_workspaceId_idx" ON "projects"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_tenantId_workspaceId_slug_key" ON "projects"("tenantId", "workspaceId", "slug");

-- CreateIndex
CREATE INDEX "nodes_tenantId_idx" ON "nodes"("tenantId");

-- CreateIndex
CREATE INDEX "nodes_projectId_idx" ON "nodes"("projectId");

-- CreateIndex
CREATE INDEX "edges_tenantId_idx" ON "edges"("tenantId");

-- CreateIndex
CREATE INDEX "edges_projectId_idx" ON "edges"("projectId");

-- CreateIndex
CREATE INDEX "edges_sourceNodeId_idx" ON "edges"("sourceNodeId");

-- CreateIndex
CREATE INDEX "edges_targetNodeId_idx" ON "edges"("targetNodeId");

-- CreateIndex
CREATE INDEX "external_refs_tenantId_idx" ON "external_refs"("tenantId");

-- CreateIndex
CREATE INDEX "external_refs_projectId_idx" ON "external_refs"("projectId");

-- CreateIndex
CREATE INDEX "external_refs_nodeId_idx" ON "external_refs"("nodeId");

-- CreateIndex
CREATE INDEX "external_refs_edgeId_idx" ON "external_refs"("edgeId");

-- CreateIndex
CREATE UNIQUE INDEX "external_refs_tenantId_projectId_system_externalId_nodeId_e_key" ON "external_refs"("tenantId", "projectId", "system", "externalId", "nodeId", "edgeId");

-- AddForeignKey
ALTER TABLE "RuntimeStateSnapshot" ADD CONSTRAINT "RuntimeStateSnapshot_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDecisionRecord" ADD CONSTRAINT "PolicyDecisionRecord_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionDecisionRecord" ADD CONSTRAINT "AdmissionDecisionRecord_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_admissionDecisionRecordId_fkey" FOREIGN KEY ("admissionDecisionRecordId") REFERENCES "AdmissionDecisionRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_refs" ADD CONSTRAINT "external_refs_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "edges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_refs" ADD CONSTRAINT "external_refs_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_refs" ADD CONSTRAINT "external_refs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

