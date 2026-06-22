CREATE TABLE "GovernedRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "currentState" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "resourceRef" TEXT NOT NULL,
  "requesterRef" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "RuntimeStateSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "governedRunId" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "safeSummary" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RuntimeStateSnapshot_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PolicyDecisionRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "governedRunId" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "safeSummary" TEXT NOT NULL,
  "policyRef" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PolicyDecisionRecord_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AdmissionDecisionRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "governedRunId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "safeSummary" TEXT NOT NULL,
  "lifecycleIntentHint" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdmissionDecisionRecord_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ApprovalRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" DATETIME,
  CONSTRAINT "ApprovalRequest_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ApprovalRequest_admissionDecisionRecordId_fkey" FOREIGN KEY ("admissionDecisionRecordId") REFERENCES "AdmissionDecisionRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AuditRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditRecord_governedRunId_fkey" FOREIGN KEY ("governedRunId") REFERENCES "GovernedRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "GovernedRun_tenantId_correlationId_key" ON "GovernedRun" ("tenantId", "correlationId");
CREATE INDEX "GovernedRun_tenantId_idx" ON "GovernedRun" ("tenantId");

CREATE INDEX "RuntimeStateSnapshot_tenantId_idx" ON "RuntimeStateSnapshot" ("tenantId");
CREATE INDEX "RuntimeStateSnapshot_governedRunId_idx" ON "RuntimeStateSnapshot" ("governedRunId");

CREATE INDEX "PolicyDecisionRecord_tenantId_idx" ON "PolicyDecisionRecord" ("tenantId");
CREATE INDEX "PolicyDecisionRecord_governedRunId_idx" ON "PolicyDecisionRecord" ("governedRunId");

CREATE INDEX "AdmissionDecisionRecord_tenantId_idx" ON "AdmissionDecisionRecord" ("tenantId");
CREATE INDEX "AdmissionDecisionRecord_governedRunId_idx" ON "AdmissionDecisionRecord" ("governedRunId");

CREATE INDEX "ApprovalRequest_tenantId_idx" ON "ApprovalRequest" ("tenantId");
CREATE INDEX "ApprovalRequest_governedRunId_idx" ON "ApprovalRequest" ("governedRunId");
CREATE INDEX "ApprovalRequest_admissionDecisionRecordId_idx" ON "ApprovalRequest" ("admissionDecisionRecordId");

CREATE INDEX "AuditRecord_tenantId_idx" ON "AuditRecord" ("tenantId");
CREATE INDEX "AuditRecord_governedRunId_idx" ON "AuditRecord" ("governedRunId");
