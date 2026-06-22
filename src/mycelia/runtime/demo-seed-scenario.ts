import type { PrismaClient } from "@prisma/client";

import { admitGovernedRequest } from "./admission";
import { syncAuthenticatedActor } from "./auth/auth-user-store";
import { getServerEnv } from "./auth/env";
import { classifyGovernedRequest } from "./classify";
import { getMyceliaDemoDatabaseConfig } from "./db/demo-config";
import { LIVE_DEMO_SCENARIO } from "./demo-scenario";
import type { GraphSnapshot } from "./graph/canonical-graph";
import { createWorkspaceProject } from "./graph/create-workspace-project";
import { persistGraphSnapshot } from "./graph/persist-graph-snapshot";
import { createPrismaProjectRepository } from "./repositories/prisma-project.repository";
import { createPrismaWorkspaceRepository } from "./repositories/prisma-workspace.repository";

export const DEMO_SEED_GOVERNED_RUN_ID =
  "demo_run_medium_risk_vendor_contract_review";
export const DEMO_SEED_CORRELATION_ID = LIVE_DEMO_SCENARIO.scenarioKey;
export const DEMO_SEED_STATE_CREATED_ID =
  "demo_state_medium_risk_vendor_contract_review_01";
export const DEMO_SEED_STATE_WAITING_APPROVAL_ID =
  "demo_state_medium_risk_vendor_contract_review_02";
export const DEMO_SEED_POLICY_ID =
  "demo_policy_medium_risk_vendor_contract_review";
export const DEMO_SEED_ADMISSION_ID =
  "demo_admission_medium_risk_vendor_contract_review";
export const DEMO_SEED_AUDIT_RUN_CREATED_ID =
  "demo_audit_medium_risk_vendor_contract_review";
export const DEMO_SEED_AUDIT_POLICY_EVALUATED_ID =
  "demo_audit_medium_risk_vendor_contract_review_02";

export const DEMO_STUDIO_USER_ID =
  "11111111-1111-4111-8111-111111111111";
export const DEMO_STUDIO_USER_EMAIL = "demo-studio-owner@example.com";
export const DEMO_STUDIO_WORKSPACE_SLUG = "acme-enterprise";
export const DEMO_STUDIO_PROJECT_SLUG = "governed-run-lifecycle";
export const DEMO_AUTH_ADMIN_DISPLAY_NAME = "MYCELIA Development Admin";

const DEMO_STUDIO_NODE_IDS = {
  request: "22222222-2222-4222-8222-222222222221",
  policy: "22222222-2222-4222-8222-222222222222",
  approval: "22222222-2222-4222-8222-222222222223",
  audit: "22222222-2222-4222-8222-222222222224",
  investigation: "22222222-2222-4222-8222-222222222225",
} as const;

const DEMO_STUDIO_EDGE_IDS = {
  requestToPolicy: "33333333-3333-4333-8333-333333333331",
  policyToApproval: "33333333-3333-4333-8333-333333333332",
  approvalToAudit: "33333333-3333-4333-8333-333333333333",
  auditToInvestigation: "33333333-3333-4333-8333-333333333334",
} as const;

export type DemoSeedScenarioClient = PrismaClient;

export type SeedDemoScenarioInput = {
  readonly client: DemoSeedScenarioClient;
  readonly tenantId?: string;
};

export type SeedDemoScenarioResult = {
  readonly tenantId: string;
  readonly governedRunId: typeof DEMO_SEED_GOVERNED_RUN_ID;
  readonly currentState: "WAITING_APPROVAL";
  readonly status: "WAITING_APPROVAL";
  readonly workspaceSlug: typeof DEMO_STUDIO_WORKSPACE_SLUG;
  readonly projectSlug: typeof DEMO_STUDIO_PROJECT_SLUG;
};

function demoStudioGraphSnapshot(projectId: string): GraphSnapshot {
  return {
    nodes: [
      {
        id: DEMO_STUDIO_NODE_IDS.request,
        projectId,
        kind: "flow-step",
        label: "Request",
        position: { x: 0, y: 0 },
        data: { stage: "request" },
        externalRefs: [],
      },
      {
        id: DEMO_STUDIO_NODE_IDS.policy,
        projectId,
        kind: "flow-step",
        label: "Policy",
        position: { x: 220, y: 0 },
        data: { stage: "policy" },
        externalRefs: [],
      },
      {
        id: DEMO_STUDIO_NODE_IDS.approval,
        projectId,
        kind: "flow-step",
        label: "Approval",
        position: { x: 440, y: 0 },
        data: { stage: "approval" },
        externalRefs: [],
      },
      {
        id: DEMO_STUDIO_NODE_IDS.audit,
        projectId,
        kind: "flow-step",
        label: "Audit",
        position: { x: 660, y: 0 },
        data: { stage: "audit" },
        externalRefs: [],
      },
      {
        id: DEMO_STUDIO_NODE_IDS.investigation,
        projectId,
        kind: "flow-step",
        label: "Investigation",
        position: { x: 880, y: 0 },
        data: { stage: "investigation" },
        externalRefs: [],
      },
    ],
    edges: [
      {
        id: DEMO_STUDIO_EDGE_IDS.requestToPolicy,
        projectId,
        sourceNodeId: DEMO_STUDIO_NODE_IDS.request,
        targetNodeId: DEMO_STUDIO_NODE_IDS.policy,
        kind: "flows-to",
        label: "classifies",
        data: { ordered: true },
        externalRefs: [],
      },
      {
        id: DEMO_STUDIO_EDGE_IDS.policyToApproval,
        projectId,
        sourceNodeId: DEMO_STUDIO_NODE_IDS.policy,
        targetNodeId: DEMO_STUDIO_NODE_IDS.approval,
        kind: "flows-to",
        label: "requires approval",
        data: { ordered: true },
        externalRefs: [],
      },
      {
        id: DEMO_STUDIO_EDGE_IDS.approvalToAudit,
        projectId,
        sourceNodeId: DEMO_STUDIO_NODE_IDS.approval,
        targetNodeId: DEMO_STUDIO_NODE_IDS.audit,
        kind: "flows-to",
        label: "records",
        data: { ordered: true },
        externalRefs: [],
      },
      {
        id: DEMO_STUDIO_EDGE_IDS.auditToInvestigation,
        projectId,
        sourceNodeId: DEMO_STUDIO_NODE_IDS.audit,
        targetNodeId: DEMO_STUDIO_NODE_IDS.investigation,
        kind: "flows-to",
        label: "investigates",
        data: { ordered: true },
        externalRefs: [],
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

async function seedDemoStudioGraph(
  client: DemoSeedScenarioClient,
  tenantId: string,
): Promise<void> {
  await client.appUser.upsert({
    where: {
      tenantId_emailNormalized: {
        tenantId,
        emailNormalized: DEMO_STUDIO_USER_EMAIL,
      },
    },
    update: {
      email: DEMO_STUDIO_USER_EMAIL,
      displayName: "Demo Studio Owner",
      active: true,
    },
    create: {
      id: DEMO_STUDIO_USER_ID,
      tenantId,
      email: DEMO_STUDIO_USER_EMAIL,
      emailNormalized: DEMO_STUDIO_USER_EMAIL,
      displayName: "Demo Studio Owner",
      active: true,
    },
  });

  const workspaces = createPrismaWorkspaceRepository(client);
  const projects = createPrismaProjectRepository(client);
  const existingWorkspace = await workspaces.findBySlug({
    tenantId,
    slug: DEMO_STUDIO_WORKSPACE_SLUG,
  });
  let projectId: string | null = null;

  if (existingWorkspace === null) {
    const created = await createWorkspaceProject({
      client,
      tenantId,
      userId: DEMO_STUDIO_USER_ID,
      workspace: {
        slug: DEMO_STUDIO_WORKSPACE_SLUG,
        name: "Acme Enterprise",
        ownerIdentity: DEMO_STUDIO_USER_EMAIL,
      },
      project: {
        slug: DEMO_STUDIO_PROJECT_SLUG,
        name: "Governed Run Lifecycle",
        description: "Read-only graph for the local governed-run demo.",
        template: "graph",
      },
    });

    if (!created.ok) {
      throw new Error(created.safeReason);
    }

    projectId = created.projectId;
  } else {
    const existingProject = await projects.findBySlug({
      tenantId,
      workspaceId: existingWorkspace.id,
      slug: DEMO_STUDIO_PROJECT_SLUG,
    });

    if (existingProject === null) {
      const createdProject = await projects.create({
        id: crypto.randomUUID(),
        tenantId,
        workspaceId: existingWorkspace.id,
        slug: DEMO_STUDIO_PROJECT_SLUG,
        name: "Governed Run Lifecycle",
        description: "Read-only graph for the local governed-run demo.",
        template: "graph",
      });
      projectId = createdProject.id;
    } else {
      projectId = existingProject.id;
    }
  }

  if (projectId === null) {
    throw new Error("Demo studio project was not resolved before graph seed.");
  }

  await persistGraphSnapshot({
    client,
    tenantId,
    projectId,
    snapshot: demoStudioGraphSnapshot(projectId),
  });
}

async function seedDevelopmentAuthUser(
  client: DemoSeedScenarioClient,
  tenantId: string,
): Promise<void> {
  const env = getServerEnv();
  const email = env.DEV_LOGIN_EMAIL.trim().toLowerCase();

  await syncAuthenticatedActor({
    client,
    tenantId,
    providerId: "credentials",
    providerType: "development_credentials",
    subject: email,
    email,
    displayName: DEMO_AUTH_ADMIN_DISPLAY_NAME,
    authMode: "development_credentials",
  });
}

export async function seedDemoScenario(
  input: SeedDemoScenarioInput,
): Promise<SeedDemoScenarioResult> {
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;
  const scenario = LIVE_DEMO_SCENARIO;
  const classification = classifyGovernedRequest({
    resourceRef: scenario.resourceRef,
    purpose: scenario.purpose,
  });
  const admission = admitGovernedRequest(classification.riskLevel);

  if (
    classification.riskLevel !== "MEDIUM" ||
    admission.outcome !== "APPROVAL_REQUIRED" ||
    admission.lifecycleIntentHint !== "WAITING_APPROVAL"
  ) {
    throw new Error("Demo seed scenario failed closed before persistence.");
  }

  await input.client.governedRun.upsert({
    where: {
      tenantId_correlationId: {
        tenantId,
        correlationId: DEMO_SEED_CORRELATION_ID,
      },
    },
    update: {
      currentState: admission.lifecycleIntentHint,
      status: admission.lifecycleIntentHint,
      resourceRef: scenario.resourceRef,
      requesterRef: scenario.requesterRef,
      purpose: scenario.purpose,
    },
    create: {
      id: DEMO_SEED_GOVERNED_RUN_ID,
      tenantId,
      correlationId: DEMO_SEED_CORRELATION_ID,
      currentState: admission.lifecycleIntentHint,
      status: admission.lifecycleIntentHint,
      resourceRef: scenario.resourceRef,
      requesterRef: scenario.requesterRef,
      purpose: scenario.purpose,
    },
  });

  await input.client.runtimeStateSnapshot.upsert({
    where: { id: DEMO_SEED_STATE_CREATED_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      state: "CREATED",
      sequence: 1,
      reasonCode: "RUN_CREATED",
      safeSummary: "Governed request was created from fixture metadata.",
    },
    create: {
      id: DEMO_SEED_STATE_CREATED_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      state: "CREATED",
      sequence: 1,
      reasonCode: "RUN_CREATED",
      safeSummary: "Governed request was created from fixture metadata.",
    },
  });

  await input.client.runtimeStateSnapshot.upsert({
    where: { id: DEMO_SEED_STATE_WAITING_APPROVAL_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      state: admission.lifecycleIntentHint,
      sequence: 2,
      reasonCode: "POLICY_REQUIRES_APPROVAL",
      safeSummary:
        "Medium risk policy evaluation moved the run to awaiting approval.",
    },
    create: {
      id: DEMO_SEED_STATE_WAITING_APPROVAL_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      state: admission.lifecycleIntentHint,
      sequence: 2,
      reasonCode: "POLICY_REQUIRES_APPROVAL",
      safeSummary:
        "Medium risk policy evaluation moved the run to awaiting approval.",
    },
  });

  await input.client.policyDecisionRecord.upsert({
    where: { id: DEMO_SEED_POLICY_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      riskLevel: classification.riskLevel,
      outcome: admission.outcome,
      reasonCode: classification.reasonCode,
      safeSummary: classification.safeSummary,
      policyRef: scenario.policyRef,
    },
    create: {
      id: DEMO_SEED_POLICY_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      riskLevel: classification.riskLevel,
      outcome: admission.outcome,
      reasonCode: classification.reasonCode,
      safeSummary: classification.safeSummary,
      policyRef: scenario.policyRef,
    },
  });

  await input.client.admissionDecisionRecord.upsert({
    where: { id: DEMO_SEED_ADMISSION_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      outcome: admission.outcome,
      reasonCode: admission.reasonCode,
      safeSummary: admission.safeSummary,
      lifecycleIntentHint: admission.lifecycleIntentHint,
    },
    create: {
      id: DEMO_SEED_ADMISSION_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      outcome: admission.outcome,
      reasonCode: admission.reasonCode,
      safeSummary: admission.safeSummary,
      lifecycleIntentHint: admission.lifecycleIntentHint,
    },
  });

  await input.client.auditRecord.upsert({
    where: { id: DEMO_SEED_AUDIT_RUN_CREATED_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      moment: "RUN_CREATED",
      requirement: "REQUIRED",
      recordKindHint: "GOVERNED_RUN",
      reasonCode: "RUN_CREATED",
      safeSummary: "Governed run creation was recorded.",
      subjectRef: DEMO_SEED_GOVERNED_RUN_ID,
      actorRef: scenario.requesterRef,
      evidenceRef: scenario.resourceRef,
    },
    create: {
      id: DEMO_SEED_AUDIT_RUN_CREATED_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      moment: "RUN_CREATED",
      requirement: "REQUIRED",
      recordKindHint: "GOVERNED_RUN",
      reasonCode: "RUN_CREATED",
      safeSummary: "Governed run creation was recorded.",
      subjectRef: DEMO_SEED_GOVERNED_RUN_ID,
      actorRef: scenario.requesterRef,
      evidenceRef: scenario.resourceRef,
    },
  });

  await input.client.auditRecord.upsert({
    where: { id: DEMO_SEED_AUDIT_POLICY_EVALUATED_ID },
    update: {
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      moment: "POLICY_EVALUATED",
      requirement: "REQUIRED",
      recordKindHint: "POLICY_DECISION_RECORD",
      reasonCode: "POLICY_EVALUATED",
      safeSummary:
        "Policy evaluation classified the fixture as medium risk and required approval.",
      subjectRef: DEMO_SEED_GOVERNED_RUN_ID,
      actorRef: scenario.requesterRef,
      evidenceRef: scenario.policyRef,
    },
    create: {
      id: DEMO_SEED_AUDIT_POLICY_EVALUATED_ID,
      tenantId,
      governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      moment: "POLICY_EVALUATED",
      requirement: "REQUIRED",
      recordKindHint: "POLICY_DECISION_RECORD",
      reasonCode: "POLICY_EVALUATED",
      safeSummary:
        "Policy evaluation classified the fixture as medium risk and required approval.",
      subjectRef: DEMO_SEED_GOVERNED_RUN_ID,
      actorRef: scenario.requesterRef,
      evidenceRef: scenario.policyRef,
    },
  });

  await seedDemoStudioGraph(input.client, tenantId);
  await seedDevelopmentAuthUser(input.client, tenantId);

  return {
    tenantId,
    governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
    currentState: "WAITING_APPROVAL",
    status: "WAITING_APPROVAL",
    workspaceSlug: DEMO_STUDIO_WORKSPACE_SLUG,
    projectSlug: DEMO_STUDIO_PROJECT_SLUG,
  };
}
