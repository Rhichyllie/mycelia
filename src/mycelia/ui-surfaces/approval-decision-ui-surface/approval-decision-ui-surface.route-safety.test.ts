import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const routePath = join(process.cwd(), "app", "mycelia", "approvals", "page.tsx");
const actionPath = join(process.cwd(), "app", "mycelia", "approvals", "actions.ts");
const legacyRoutePath = join(
  process.cwd(),
  "app",
  "mycelia",
  "approval",
  "decision",
  "page.tsx",
);
const routeHandlerPath = join(process.cwd(), "app", "mycelia", "approvals", "route.ts");

function routeSource(): string {
  return readFileSync(routePath, "utf8");
}

describe("approval decision route safety", () => {
  it("creates the controlled approvals page route", () => {
    const source = routeSource();

    expect(existsSync(routePath)).toBe(true);
    expect(source).toContain("export default async function MyceliaApprovalDecisionPage");
    expect(source).toContain("approveGovernedRequest");
    expect(source).toContain("rejectGovernedRequest");
  });

  it("keeps the legacy approval decision route as a redirect", () => {
    const source = readFileSync(legacyRoutePath, "utf8");

    expect(source).toContain("redirect");
    expect(source).toContain("/mycelia/approvals");
  });

  it("does not create a route handler or API behavior", () => {
    const source = routeSource();

    expect(existsSync(routeHandlerPath)).toBe(false);
    expect(source).not.toContain("NextRequest");
    expect(source).not.toContain("Response.json");
    expect(source).not.toContain("GET(");
    expect(source).not.toContain("POST(");
  });

  it("keeps the route scoped to the LIVE-9 approval decision center actions", () => {
    const source = routeSource();

    expect(source).not.toContain("\"use client\"");
    expect(source).not.toContain("'use client'");
    expect(source).toContain("listPendingForTenant");
    expect(source).toContain("loadInvestigationTimeline");
    expect(source).toContain("approvalId");
    expect(source).toContain("safeDecisionSummary");
    expect(source).toContain("Rejection rationale");
    expect(source).toContain("<textarea");
    expect(source).toContain("<form action={approveGovernedRequest}");
    expect(source).toContain("<form action={rejectGovernedRequest}");
    expect(source).toContain("Approve");
    expect(source).toContain("Reject");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("PrismaClient");
    expect(source).not.toContain("@prisma/client");
    expect(source).not.toMatch(/cookies\s*\(|headers\s*\(|auth\s*\(/i);
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("download");
    expect(source).not.toContain("pdf");
  });

  it("keeps the server action file free of route handler and external behavior", () => {
    const source = readFileSync(actionPath, "utf8");

    expect(existsSync(actionPath)).toBe(true);
    expect(source).toContain('"use server"');
    expect(source).toContain("approveGovernedRequest");
    expect(source).toContain("rejectGovernedRequest");
    expect(source).toContain("APPROVAL_RATIONALE_REQUIRED");
    expect(source).toContain("safeDecisionSummary");
    expect(source).not.toMatch(/route\.ts|NextRequest|Response\.json/i);
    expect(source).not.toMatch(/fetch\s*\(/i);
    expect(source).not.toMatch(/cookies\s*\(|headers\s*\(|auth\s*\(/i);
    expect(source).not.toMatch(/download|pdf/i);
  });
});
