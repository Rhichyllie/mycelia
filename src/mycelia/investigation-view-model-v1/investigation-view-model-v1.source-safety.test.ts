import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const modulePath = resolve(
  process.cwd(),
  "src/mycelia/investigation-view-model-v1/investigation-view-model-v1.ts",
);

const packagePath = resolve(process.cwd(), "package.json");
const lockfilePath = resolve(process.cwd(), "pnpm-lock.yaml");

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

describe("investigation view model v1 source safety", () => {
  it("does not include unsafe runtime, IO, UI, audit writing or service behavior", () => {
    const source = readSource(modulePath);
    const forbiddenPatterns = [
      /dangerouslySetInnerHTML/,
      /fetch\s*\(/,
      /axios/,
      /XMLHttpRequest/,
      /cookies\s*\(/,
      /headers\s*\(/,
      /redirect\s*\(/,
      /notFound\s*\(/,
      /revalidate/,
      /["']use server["']/,
      /localStorage/,
      /sessionStorage/,
      /setTimeout/,
      /setInterval/,
      /Math\.random/,
      /Date\.now/,
      /readFile/,
      /writeFile/,
      /appendFile/,
      /createReadStream/,
      /createWriteStream/,
      /node:fs/,
      /node:path/,
      /https?:\/\//,
      /www\./,
      /MapIA/i,
      /PrismaClient/,
      /@prisma\/client/,
      /prisma\s+migrate/i,
      /migration\.sql/i,
      /CREATE\s+TABLE/i,
      /datasource\s+db/i,
      /generator\s+client/i,
      /EventEmitter/,
      /\.emit\s*\(/,
      /recordAudit/i,
      /writeAudit/i,
      /appendAudit/i,
      /appendLog/i,
      /auditStore/i,
      /auditRepository/i,
      /database\.query/i,
      /\.query\s*\(/,
      /findMany/,
      /findUnique/,
      /executeTool/i,
      /toolExecution/i,
      /URL\.createObjectURL/,
      /new\s+Blob/,
      /download\s*=/,
      /<a\s+download/i,
      /pdfMake/i,
      /jsPDF/i,
      /generatePdf/i,
      /exportFile/i,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(source).not.toMatch(pattern);
    }
  });

  it("does not modify package metadata or lockfile for this module", () => {
    const packageJson = readSource(packagePath);
    const lockfile = readSource(lockfilePath);

    expect(packageJson).toContain("\"scripts\"");
    expect(lockfile).toContain("lockfileVersion");
  });
});
