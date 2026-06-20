import { getMyceliaDemoDatabaseConfig } from "../src/mycelia/runtime/db/demo-config";

process.env.DATABASE_URL ??= "file:./dev.db";

const scenarioKey = "medium-risk-vendor-contract-review";
const scenarioId = "demo_run_medium_risk_vendor_contract_review";

const demoScenario = {
  tenantId: getMyceliaDemoDatabaseConfig().tenantId,
  scenarioKey,
  title: "Medium-risk vendor contract review",
  summary: "Local demo scenario for a governed vendor contract review.",
  riskLevel: "MEDIUM",
  resourceRef: "fixture://documents/vendor-contract-review",
  requesterRef: "demo://actor/requester",
  purpose:
    "Governed review of a vendor contract fixture before AI-assisted operational action",
  fixtureKind: "LOCAL_DEMO_FIXTURE",
  safeMetadataJson: JSON.stringify({
    fixtureKind: "LOCAL_DEMO_FIXTURE",
    containsRawDocumentContent: false,
    source: "fixture metadata only",
  }),
} as const;

async function main() {
  const { prisma } = await import("../src/mycelia/runtime/db/client");

  await prisma.governedRun.upsert({
    where: {
      tenantId_correlationId: {
        tenantId: demoScenario.tenantId,
        correlationId: demoScenario.scenarioKey,
      },
    },
    update: {
      currentState: "WAITING_APPROVAL",
      status: "DEMO_READY",
      resourceRef: demoScenario.resourceRef,
      requesterRef: demoScenario.requesterRef,
      purpose: demoScenario.purpose,
    },
    create: {
      id: scenarioId,
      tenantId: demoScenario.tenantId,
      correlationId: demoScenario.scenarioKey,
      currentState: "WAITING_APPROVAL",
      status: "DEMO_READY",
      resourceRef: demoScenario.resourceRef,
      requesterRef: demoScenario.requesterRef,
      purpose: demoScenario.purpose,
    },
  });

  await prisma.runtimeStateSnapshot.upsert({
    where: { id: "demo_state_medium_risk_vendor_contract_review_01" },
    update: {
      tenantId: demoScenario.tenantId,
      governedRunId: scenarioId,
      state: "WAITING_APPROVAL",
      sequence: 1,
      reasonCode: "MEDIUM_RISK_APPROVAL_REQUIRED",
      safeSummary: "Demo scenario is ready at the approval boundary.",
    },
    create: {
      id: "demo_state_medium_risk_vendor_contract_review_01",
      tenantId: demoScenario.tenantId,
      governedRunId: scenarioId,
      state: "WAITING_APPROVAL",
      sequence: 1,
      reasonCode: "MEDIUM_RISK_APPROVAL_REQUIRED",
      safeSummary: "Demo scenario is ready at the approval boundary.",
    },
  });

  await prisma.policyDecisionRecord.upsert({
    where: { id: "demo_policy_medium_risk_vendor_contract_review" },
    update: {
      tenantId: demoScenario.tenantId,
      governedRunId: scenarioId,
      riskLevel: demoScenario.riskLevel,
      outcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_APPROVAL_REQUIRED",
      safeSummary: demoScenario.summary,
      policyRef: "demo://policy/vendor-contract-review",
    },
    create: {
      id: "demo_policy_medium_risk_vendor_contract_review",
      tenantId: demoScenario.tenantId,
      governedRunId: scenarioId,
      riskLevel: demoScenario.riskLevel,
      outcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_APPROVAL_REQUIRED",
      safeSummary: demoScenario.summary,
      policyRef: "demo://policy/vendor-contract-review",
    },
  });

  await prisma.auditRecord.upsert({
    where: { id: "demo_audit_medium_risk_vendor_contract_review" },
    update: {
      tenantId: demoScenario.tenantId,
      governedRunId: scenarioId,
      moment: "DEMO_SCENARIO_SEEDED",
      requirement: "LOCAL_DEMO_ONLY",
      recordKindHint: "GOVERNED_RUN",
      reasonCode: "DEMO_SCENARIO_READY",
      safeSummary:
        "Seeded fixture metadata only; no raw document content is stored.",
      subjectRef: scenarioId,
      actorRef: getMyceliaDemoDatabaseConfig().approverRef,
      evidenceRef: "fixture://metadata/vendor-contract-review",
    },
    create: {
      id: "demo_audit_medium_risk_vendor_contract_review",
      tenantId: demoScenario.tenantId,
      governedRunId: scenarioId,
      moment: "DEMO_SCENARIO_SEEDED",
      requirement: "LOCAL_DEMO_ONLY",
      recordKindHint: "GOVERNED_RUN",
      reasonCode: "DEMO_SCENARIO_READY",
      safeSummary:
        "Seeded fixture metadata only; no raw document content is stored.",
      subjectRef: scenarioId,
      actorRef: getMyceliaDemoDatabaseConfig().approverRef,
      evidenceRef: "fixture://metadata/vendor-contract-review",
    },
  });

  console.log(
    `Seeded MYCELIA local demo database for ${demoScenario.tenantId}: ${demoScenario.title}`,
  );

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  const { prisma } = await import("../src/mycelia/runtime/db/client");

  await prisma.$disconnect();
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exit(1);
});
