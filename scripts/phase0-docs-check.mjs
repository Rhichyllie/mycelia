import { existsSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "docs/mycelia/00-vision-and-foundational-manifesto.md",
  "docs/mycelia/01-product-requirements-and-operational-scope.md",
  "docs/mycelia/02-core-runtime-architecture.md",
  "docs/mycelia/03-canonical-domain-model.md",
  "docs/mycelia/19-codex-operational-alignment-and-engineering-constitution.md",
  "docs/README.md",
  "docs/mycelia/README.md",
  "docs/architecture/registry.md",
  "docs/architecture/module-map.md",
  "docs/adrs/0000-adr-template.md",
  "contracts/README.md",
  "contracts/events/README.md",
  "contracts/apis/README.md",
  "contracts/tools/README.md",
  "contracts/policies/README.md",
  "contracts/memory/README.md",
  "contracts/telemetry/README.md",
  "contracts/security-events/README.md",
  "contracts/integrations/README.md",
  "contracts/schemas/README.md",
  "src/README.md",
  "prisma/README.md",
  "public/README.md",
  "legacy/mapia-active-snapshot/README.md",
];

const missingFiles = requiredFiles.filter((file) => !existsSync(resolve(file)));

if (missingFiles.length > 0) {
  console.error("Phase 0 documentation check failed. Missing required files:");
  for (const file of missingFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log(
  `Phase 0 documentation check passed (${requiredFiles.length} files present).`,
);
