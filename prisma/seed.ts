import { getMyceliaDemoDatabaseConfig } from "../src/mycelia/runtime/db/demo-config";
import { LIVE_DEMO_SCENARIO } from "../src/mycelia/runtime/demo-scenario";
import { seedDemoScenario } from "../src/mycelia/runtime/demo-seed-scenario";

process.env.DATABASE_URL ??=
  "postgresql://mycelia:mycelia_dev@localhost:5432/mycelia";

async function main() {
  const { prisma } = await import("../src/mycelia/runtime/db/client");
  const result = await seedDemoScenario({
    client: prisma,
    tenantId: getMyceliaDemoDatabaseConfig().tenantId,
  });

  console.log(
    `Seeded MYCELIA local demo database for ${result.tenantId}: ${LIVE_DEMO_SCENARIO.title}`,
  );

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  const { prisma } = await import("../src/mycelia/runtime/db/client");

  await prisma.$disconnect();
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exit(1);
});
