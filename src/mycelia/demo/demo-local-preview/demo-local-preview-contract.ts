export const DEMO_LOCAL_PREVIEW_PHASE = "3L";

export const DEMO_LOCAL_PREVIEW_NAME = "Demo Hardening Local Preview";

export const DEMO_LOCAL_PREVIEW_COMMAND = "pnpm demo:local";

export const DEMO_LOCAL_PREVIEW_HOST = "127.0.0.1";

export const DEMO_LOCAL_PREVIEW_DEFAULT_PORT = 3000;

export const DemoLocalPreviewStatuses = [
  "DEMO_LOCAL_PREVIEW_READY",
  "DEMO_LOCAL_PREVIEW_BLOCKED",
  "DEMO_LOCAL_PREVIEW_FAILED_SAFE",
] as const;

export type DemoLocalPreviewStatus =
  (typeof DemoLocalPreviewStatuses)[number];

export const DemoLocalPreviewAllowedRoutes = [
  "/mycelia",
  "/mycelia/demo",
  "/mycelia/request/new",
  "/mycelia/approval/decision",
  "/mycelia/investigation",
] as const;

export type DemoLocalPreviewAllowedRoute =
  (typeof DemoLocalPreviewAllowedRoutes)[number];

export const DemoLocalPreviewForbiddenCapabilities = [
  "production runtime activation",
  "live persistence write",
  "API route",
  "auth",
  "RBAC",
  "notification runtime",
  "replay execution",
  "export, PDF or download behavior",
  "external integration",
  "tool execution",
  "broad workflow builder",
  "broad dashboard, list or search",
  "billing or SaaS expansion",
] as const;

export type DemoLocalPreviewForbiddenCapability =
  (typeof DemoLocalPreviewForbiddenCapabilities)[number];

export type DemoLocalPreviewContract = {
  readonly phase: typeof DEMO_LOCAL_PREVIEW_PHASE;
  readonly name: typeof DEMO_LOCAL_PREVIEW_NAME;
  readonly command: typeof DEMO_LOCAL_PREVIEW_COMMAND;
  readonly host: typeof DEMO_LOCAL_PREVIEW_HOST;
  readonly defaultPort: typeof DEMO_LOCAL_PREVIEW_DEFAULT_PORT;
  readonly allowedRoutes: readonly DemoLocalPreviewAllowedRoute[];
  readonly safetyBoundary: readonly string[];
  readonly forbiddenCapabilities: readonly DemoLocalPreviewForbiddenCapability[];
  readonly previewStatus: DemoLocalPreviewStatus;
  readonly safeSummary: string;
};

export const DEMO_LOCAL_PREVIEW_SAFETY_BOUNDARY = [
  "Local browser inspection is limited to MYCELIA demo surfaces.",
  "The preview command binds to 127.0.0.1 by default.",
  "The preview command does not start production runtime behavior.",
  "The preview contract is descriptive and does not start servers.",
] as const;

export const DEMO_LOCAL_PREVIEW_CONTRACT = {
  phase: DEMO_LOCAL_PREVIEW_PHASE,
  name: DEMO_LOCAL_PREVIEW_NAME,
  command: DEMO_LOCAL_PREVIEW_COMMAND,
  host: DEMO_LOCAL_PREVIEW_HOST,
  defaultPort: DEMO_LOCAL_PREVIEW_DEFAULT_PORT,
  allowedRoutes: DemoLocalPreviewAllowedRoutes,
  safetyBoundary: DEMO_LOCAL_PREVIEW_SAFETY_BOUNDARY,
  forbiddenCapabilities: DemoLocalPreviewForbiddenCapabilities,
  previewStatus: "DEMO_LOCAL_PREVIEW_READY",
  safeSummary:
    "Phase 3L enables narrow local-only visual inspection of controlled MYCELIA demo routes without activating production runtime behavior.",
} as const satisfies DemoLocalPreviewContract;

export function getDemoLocalPreviewUrls(
  port: number = DEMO_LOCAL_PREVIEW_DEFAULT_PORT,
): readonly string[] {
  return DemoLocalPreviewAllowedRoutes.map(
    (route) => `http://${DEMO_LOCAL_PREVIEW_HOST}:${port}${route}`,
  );
}
