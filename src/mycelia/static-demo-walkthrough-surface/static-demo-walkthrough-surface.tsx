import type { CSSProperties, ReactElement } from "react";

export const STATIC_DEMO_WALKTHROUGH_ROUTES = [
  "/",
  "/mycelia",
  "/mycelia/static-demo",
  "/mycelia/roadmap",
  "/mycelia/walkthrough",
  "/mycelia/executive",
] as const;

export const STATIC_DEMO_WALKTHROUGH_STEP_TITLES = [
  "Request intake",
  "Identity resolution",
  "Tenant boundary",
  "Policy decision",
  "Runtime admission",
  "Governed run",
  "Runtime state",
  "State transition",
  "Audit record",
  "Investigation bundle",
  "Replay plan",
  "Readiness report",
  "Static artifact",
  "Human-readable preview",
] as const;

export const STATIC_DEMO_WALKTHROUGH_PROOFS = [
  "governed execution can be described before execution",
  "policy and admission boundaries can be represented safely",
  "state and audit descriptors can be linked into an investigation story",
  "replay can be planned without simulating runtime",
  "a customer-safe static artifact can be rendered and previewed",
] as const;

export const STATIC_DEMO_WALKTHROUGH_NOT_ACTIVE = [
  "runtime execution",
  "workflow execution",
  "real agent execution",
  "persistence",
  "authentication",
  "API routes",
  "external integrations",
  "real replay simulation",
  "file export",
  "PDF generation",
  "downloadable artifacts",
] as const;

export const STATIC_DEMO_WALKTHROUGH_SAFETY_BOUNDARY = [
  "current routes are static, read-only and descriptor-level",
  "no runtime execution",
  "no persistence",
  "no API calls",
  "no external service calls",
  "no user input",
  "no file export",
  "no PDF or download behavior",
] as const;

export type StaticDemoWalkthroughStep = {
  readonly step_order: number;
  readonly title: (typeof STATIC_DEMO_WALKTHROUGH_STEP_TITLES)[number];
  readonly summary: string;
  readonly descriptor_focus: string;
  readonly safety_note: string;
};

export type StaticDemoWalkthroughSurfaceModel = {
  readonly title: "MYCELIA";
  readonly positioning: readonly string[];
  readonly routes: readonly (typeof STATIC_DEMO_WALKTHROUGH_ROUTES)[number][];
  readonly summary: string;
  readonly guided_steps: readonly StaticDemoWalkthroughStep[];
  readonly proof_section: {
    readonly title: "What the walkthrough proves";
    readonly items: readonly string[];
  };
  readonly not_active_section: {
    readonly title: "Not active yet";
    readonly items: readonly string[];
  };
  readonly safety_section: {
    readonly title: "Safety boundary";
    readonly items: readonly string[];
  };
  readonly navigation_callouts: readonly {
    readonly label: string;
    readonly href:
      | "/mycelia"
      | "/mycelia/static-demo"
      | "/mycelia/roadmap"
      | "/mycelia/executive";
    readonly body: string;
  }[];
};

const guidedSteps: readonly StaticDemoWalkthroughStep[] = [
  {
    step_order: 1,
    title: "Request intake",
    summary: "The story begins with a safe operational request descriptor.",
    descriptor_focus: "request envelope",
    safety_note: "No request is executed.",
  },
  {
    step_order: 2,
    title: "Identity resolution",
    summary: "A runtime identity descriptor is associated with the request.",
    descriptor_focus: "runtime identity",
    safety_note: "No authentication system is activated.",
  },
  {
    step_order: 3,
    title: "Tenant boundary",
    summary: "The operation is scoped to an explicit tenant boundary.",
    descriptor_focus: "tenant scope",
    safety_note: "No tenant inference is performed.",
  },
  {
    step_order: 4,
    title: "Policy decision",
    summary: "A policy decision descriptor explains the governance outcome.",
    descriptor_focus: "policy decision",
    safety_note: "No policy engine executes rules.",
  },
  {
    step_order: 5,
    title: "Runtime admission",
    summary: "Admission is represented as a pre-runtime decision descriptor.",
    descriptor_focus: "admission decision",
    safety_note: "No runtime admission side effect occurs.",
  },
  {
    step_order: 6,
    title: "Governed run",
    summary: "A governed run shell descriptor names the admitted operation.",
    descriptor_focus: "governed run shell",
    safety_note: "No workflow or tool execution starts.",
  },
  {
    step_order: 7,
    title: "Runtime state",
    summary: "A runtime state descriptor captures the shell state.",
    descriptor_focus: "runtime state snapshot",
    safety_note: "No state is persisted.",
  },
  {
    step_order: 8,
    title: "State transition",
    summary: "A transition descriptor explains a validated state movement.",
    descriptor_focus: "state transition contract",
    safety_note: "No state machine mutates data.",
  },
  {
    step_order: 9,
    title: "Audit record",
    summary: "Audit descriptors preserve the governance story.",
    descriptor_focus: "audit record descriptor",
    safety_note: "No audit store is written.",
  },
  {
    step_order: 10,
    title: "Investigation bundle",
    summary: "Investigation descriptors group related evidence references.",
    descriptor_focus: "investigation bundle",
    safety_note: "No case management or storage query runs.",
  },
  {
    step_order: 11,
    title: "Replay plan",
    summary: "Replay planning is represented as an inspection plan.",
    descriptor_focus: "replay plan descriptor",
    safety_note: "No replay simulation occurs.",
  },
  {
    step_order: 12,
    title: "Readiness report",
    summary: "A readiness descriptor marks the demo as statically ready.",
    descriptor_focus: "demo readiness report",
    safety_note: "Readiness does not mean executable.",
  },
  {
    step_order: 13,
    title: "Static artifact",
    summary: "A static artifact descriptor organizes the product preview.",
    descriptor_focus: "static demo artifact",
    safety_note: "No file export is created.",
  },
  {
    step_order: 14,
    title: "Human-readable preview",
    summary: "The final preview renders safe plain text for readers.",
    descriptor_focus: "plain text renderer output",
    safety_note: "No HTML injection or external service is used.",
  },
];

export function getStaticDemoWalkthroughSurfaceModel():
  StaticDemoWalkthroughSurfaceModel {
  return {
    title: "MYCELIA",
    positioning: [
      "governed operational intelligence",
      "governed agentic runtime",
      "descriptor-level execution governance",
    ],
    routes: STATIC_DEMO_WALKTHROUGH_ROUTES,
    summary:
      "This is a static guided walkthrough of the first MYCELIA demo descriptor chain. It explains the governed operation story without runtime execution.",
    guided_steps: guidedSteps,
    proof_section: {
      title: "What the walkthrough proves",
      items: STATIC_DEMO_WALKTHROUGH_PROOFS,
    },
    not_active_section: {
      title: "Not active yet",
      items: STATIC_DEMO_WALKTHROUGH_NOT_ACTIVE,
    },
    safety_section: {
      title: "Safety boundary",
      items: STATIC_DEMO_WALKTHROUGH_SAFETY_BOUNDARY,
    },
    navigation_callouts: [
      {
        label: "Product hub",
        href: "/mycelia",
        body: "Review the product information architecture.",
      },
      {
        label: "Static demo",
        href: "/mycelia/static-demo",
        body: "Open the static descriptor-level demo surface.",
      },
      {
        label: "Roadmap",
        href: "/mycelia/roadmap",
        body: "Review planned surfaces and inactive capabilities.",
      },
      {
        label: "Executive narrative",
        href: "/mycelia/executive",
        body: "Read the plain-language product narrative for stakeholders.",
      },
    ],
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f3",
    color: "#17231d",
  },
  shell: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "44px 0 56px",
  },
  hero: {
    border: "1px solid #d5ded5",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "32px",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(300px, 0.95fr)",
    gap: "30px",
    alignItems: "start",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#4d6658",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "2.65rem",
    lineHeight: 1.08,
    letterSpacing: 0,
  },
  lead: {
    maxWidth: "760px",
    margin: "16px 0 0",
    color: "#46584e",
    fontSize: "1.02rem",
    lineHeight: 1.62,
  },
  positioningList: {
    display: "grid",
    gap: "10px",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  positioningItem: {
    border: "1px solid #c2cec5",
    borderRadius: "8px",
    background: "#f8faf7",
    color: "#2b4033",
    padding: "12px",
    fontSize: "0.86rem",
    fontWeight: 750,
  },
  section: {
    border: "1px solid #d7ddd7",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "24px",
    marginTop: "24px",
  },
  sectionMuted: {
    border: "1px solid #d7ddd7",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "24px",
    marginTop: "24px",
  },
  sectionTitle: {
    margin: 0,
    color: "#1e3126",
    fontSize: "1.08rem",
    lineHeight: 1.35,
    letterSpacing: 0,
  },
  bodyText: {
    margin: "10px 0 0",
    color: "#4b5b52",
    fontSize: "0.94rem",
    lineHeight: 1.58,
  },
  stepGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "16px",
    marginTop: "18px",
  },
  stepCard: {
    border: "1px solid #dce4dc",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "18px",
  },
  stepOrder: {
    display: "inline-flex",
    border: "1px solid #c7d2c9",
    borderRadius: "999px",
    background: "#f8faf7",
    color: "#33483b",
    padding: "4px 8px",
    fontSize: "0.74rem",
    fontWeight: 750,
  },
  stepTitle: {
    margin: "12px 0 0",
    color: "#1e3126",
    fontSize: "1rem",
    lineHeight: 1.35,
  },
  stepText: {
    margin: "9px 0 0",
    color: "#4b5b52",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  stepMeta: {
    margin: "10px 0 0",
    color: "#2f4638",
    fontSize: "0.84rem",
    fontWeight: 700,
    lineHeight: 1.45,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
    gap: "22px",
    marginTop: "24px",
    alignItems: "start",
  },
  list: {
    display: "grid",
    gap: "10px",
    margin: "16px 0 0",
    padding: 0,
    listStyle: "none",
  },
  listItem: {
    borderLeft: "3px solid #8ca894",
    padding: "8px 0 8px 12px",
    color: "#25352c",
    fontSize: "0.92rem",
    lineHeight: 1.45,
  },
  calloutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "18px",
    marginTop: "24px",
  },
  callout: {
    borderLeft: "4px solid #5f846d",
    background: "#f6f9f6",
    padding: "20px",
  },
  calloutTitle: {
    margin: 0,
    color: "#1d3026",
    fontSize: "1.02rem",
    fontWeight: 750,
    lineHeight: 1.4,
  },
  calloutText: {
    margin: "10px 0 0",
    color: "#506158",
    fontSize: "0.92rem",
    lineHeight: 1.55,
  },
  calloutLink: {
    display: "inline-flex",
    marginTop: "16px",
    border: "1px solid #355642",
    borderRadius: "6px",
    background: "#263f30",
    color: "#ffffff",
    padding: "10px 13px",
    fontSize: "0.9rem",
    fontWeight: 700,
    textDecoration: "none",
  },
} satisfies Record<string, CSSProperties>;

function renderPositioning(items: readonly string[]): ReactElement[] {
  return items.map((item) => (
    <li key={item} style={styles.positioningItem}>
      {item}
    </li>
  ));
}

function renderGuidedSteps(
  steps: readonly StaticDemoWalkthroughStep[],
): ReactElement[] {
  return steps.map((step) => (
    <article key={step.step_order} style={styles.stepCard}>
      <span style={styles.stepOrder}>Step {step.step_order}</span>
      <h3 style={styles.stepTitle}>{step.title}</h3>
      <p style={styles.stepText}>{step.summary}</p>
      <p style={styles.stepMeta}>Focus: {step.descriptor_focus}</p>
      <p style={styles.stepText}>{step.safety_note}</p>
    </article>
  ));
}

function renderItems(items: readonly string[]): ReactElement[] {
  return items.map((item) => (
    <li key={item} style={styles.listItem}>
      {item}
    </li>
  ));
}

function renderCallouts(
  callouts: StaticDemoWalkthroughSurfaceModel["navigation_callouts"],
): ReactElement[] {
  return callouts.map((callout) => (
    <aside key={callout.href} style={styles.callout}>
      <h2 style={styles.calloutTitle}>{callout.label}</h2>
      <p style={styles.calloutText}>{callout.body}</p>
      <a href={callout.href} style={styles.calloutLink}>
        {callout.href}
      </a>
    </aside>
  ));
}

export function StaticDemoWalkthroughSurface(): ReactElement {
  const model = getStaticDemoWalkthroughSurfaceModel();

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div>
              <p style={styles.eyebrow}>Static demo walkthrough</p>
              <h1 style={styles.title}>{model.title}</h1>
              <p style={styles.lead}>{model.summary}</p>
            </div>
            <ul aria-label="Walkthrough positioning" style={styles.positioningList}>
              {renderPositioning(model.positioning)}
            </ul>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Guided operation story</h2>
          <p style={styles.bodyText}>
            Each step is a descriptor-level explanation of the static demo
            chain. None of these steps executes runtime behavior.
          </p>
          <div style={styles.stepGrid}>
            {renderGuidedSteps(model.guided_steps)}
          </div>
        </section>

        <section style={styles.grid}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{model.proof_section.title}</h2>
            <ul style={styles.list}>
              {renderItems(model.proof_section.items)}
            </ul>
          </div>

          <div style={styles.sectionMuted}>
            <h2 style={styles.sectionTitle}>
              {model.not_active_section.title}
            </h2>
            <ul style={styles.list}>
              {renderItems(model.not_active_section.items)}
            </ul>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{model.safety_section.title}</h2>
            <ul style={styles.list}>
              {renderItems(model.safety_section.items)}
            </ul>
          </div>
        </section>

        <section aria-label="Walkthrough navigation" style={styles.calloutGrid}>
          {renderCallouts(model.navigation_callouts)}
        </section>
      </div>
    </main>
  );
}

export default StaticDemoWalkthroughSurface;
