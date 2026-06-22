export const MYCELIA_TOKENS = {
  color: {
    bg: {
      canvas: "#121512",
      surface: "#181C19",
      panel: "#232724",
      sunken: "#0A0C0B",
    },
    text: {
      primary: "#F2F0E9",
      secondary: "#C9CFC9",
      tertiary: "#8C948D",
      disabled: "#5C6660",
      inverse: "#0A0C0B",
    },
    border: {
      subtle: "#343A36",
      strong: "#8C948D",
      focus: "#C9CFC9",
    },
    brand: {
      sage: "#8FA396",
      moss: "#566B5C",
      ivory: "#F2F0E9",
      silver: "#C9CFC9",
    },
    state: {
      success: "#7DA889",
      warning: "#D9A857",
      danger: "#C2594F",
      info: "#6E97AE",
    },
    policy: {
      approved: "#7DA889",
      denied: "#C2594F",
      requiresApproval: "#D9A857",
      boundary: "#6E97AE",
    },
    runtime: {
      active: "#7DA889",
      suspended: "#D9A857",
      failed: "#C2594F",
      degraded: "#B98A4E",
      stale: "#5C6660",
      quarantined: "#7C5C8F",
    },
    evidence: {
      sealed: "#566B5C",
      draft: "#8C948D",
    },
    tenant: {
      boundary: "#A9B6AE",
    },
    intent: {
      successBg: "rgba(125, 168, 137, 0.12)",
      warningBg: "rgba(217, 168, 87, 0.12)",
      dangerBg: "rgba(194, 89, 79, 0.12)",
      infoBg: "rgba(110, 151, 174, 0.12)",
      neutralBg: "rgba(201, 207, 201, 0.08)",
      accentBg: "rgba(143, 163, 150, 0.14)",
    },
  },
  spacing: {
    0: "0",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
  },
  radius: {
    none: "0",
    sm: "4px",
    md: "8px",
    panel: "12px",
    lg: "16px",
    full: "9999px",
  },
  type: {
    family:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    mono:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
    display: "clamp(2rem, 3vw, 3.5rem)",
    heading1: "clamp(1.75rem, 2.7vw, 2.5rem)",
    heading2: "clamp(1.35rem, 2vw, 1.75rem)",
    heading3: "1rem",
    body: "0.94rem",
    bodySmall: "0.84rem",
    label: "0.72rem",
    badge: "0.7rem",
    data: "0.9rem",
  },
  layout: {
    pageWidth: "min(1180px, calc(100% - 40px))",
    pagePadding: "34px 0 48px",
  },
  motion: {
    duration: {
      instant: "0ms",
      fast: "100ms",
      base: "200ms",
      slow: "300ms",
    },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      enter: "cubic-bezier(0, 0, 0.2, 1)",
      exit: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
  border: {
    subtle: "1px solid #343A36",
    strong: "1px solid #8C948D",
    focus: "2px solid #C9CFC9",
  },
} as const;

export type MyceliaDesignTokens = typeof MYCELIA_TOKENS;
