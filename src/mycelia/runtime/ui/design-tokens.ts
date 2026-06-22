function tokenVar(path: string): string {
  return `var(--mycelia-${path.replace(/\./g, "-")})`;
}

export const MYCELIA_TOKENS = {
  color: {
    bg: {
      canvas: tokenVar("color.bg.canvas"),
      surface: tokenVar("color.bg.surface"),
      panel: tokenVar("color.bg.panel"),
      sunken: tokenVar("color.bg.sunken"),
    },
    text: {
      primary: tokenVar("color.text.primary"),
      secondary: tokenVar("color.text.secondary"),
      tertiary: tokenVar("color.text.tertiary"),
      disabled: tokenVar("color.text.disabled"),
      inverse: tokenVar("color.text.inverse"),
    },
    border: {
      subtle: tokenVar("color.border.subtle"),
      strong: tokenVar("color.border.strong"),
      focus: tokenVar("color.border.focus"),
    },
    brand: {
      sage: tokenVar("color.brand.sage"),
      moss: tokenVar("color.brand.moss"),
      ivory: tokenVar("color.brand.ivory"),
      silver: tokenVar("color.brand.silver"),
    },
    state: {
      success: tokenVar("color.state.success"),
      warning: tokenVar("color.state.warning"),
      danger: tokenVar("color.state.danger"),
      info: tokenVar("color.state.info"),
    },
    policy: {
      approved: tokenVar("color.policy.approved"),
      denied: tokenVar("color.policy.denied"),
      requiresApproval: tokenVar("color.policy.requiresApproval"),
      boundary: tokenVar("color.policy.boundary"),
    },
    runtime: {
      active: tokenVar("color.runtime.active"),
      suspended: tokenVar("color.runtime.suspended"),
      failed: tokenVar("color.runtime.failed"),
      degraded: tokenVar("color.runtime.degraded"),
      stale: tokenVar("color.runtime.stale"),
      quarantined: tokenVar("color.runtime.quarantined"),
    },
    evidence: {
      sealed: tokenVar("color.evidence.sealed"),
      draft: tokenVar("color.evidence.draft"),
    },
    tenant: {
      boundary: tokenVar("color.tenant.boundary"),
    },
    intent: {
      successBg: tokenVar("color.intent.successBg"),
      warningBg: tokenVar("color.intent.warningBg"),
      dangerBg: tokenVar("color.intent.dangerBg"),
      infoBg: tokenVar("color.intent.infoBg"),
      neutralBg: tokenVar("color.intent.neutralBg"),
      accentBg: tokenVar("color.intent.accentBg"),
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
    panel: "10px",
    lg: "14px",
    full: "999px",
  },
  type: {
    family: tokenVar("type.family"),
    mono: tokenVar("type.mono"),
    display: tokenVar("type.display"),
    heading1: tokenVar("type.heading1"),
    heading2: tokenVar("type.heading2"),
    heading3: tokenVar("type.heading3"),
    body: tokenVar("type.body"),
    bodySmall: tokenVar("type.bodySmall"),
    label: tokenVar("type.label"),
    badge: tokenVar("type.badge"),
    data: tokenVar("type.data"),
  },
  layout: {
    pageWidth: tokenVar("layout.pageWidth"),
    pagePadding: tokenVar("layout.pagePadding"),
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
    subtle: tokenVar("border.subtle"),
    strong: tokenVar("border.strong"),
    focus: tokenVar("border.focus"),
  },
} as const;

type TokenLeaf = string;
type TokenKey = string | number;

type DotPath<T> = {
  [K in keyof T & TokenKey]: T[K] extends TokenLeaf
    ? `${K}`
    : T[K] extends Record<TokenKey, unknown>
      ? `${K}.${DotPath<T[K]>}`
      : never;
}[keyof T & TokenKey];

export type MyceliaDesignTokens = typeof MYCELIA_TOKENS;
export type FlatMyceliaTokenPaths = DotPath<MyceliaDesignTokens>;

export function myceliaVar(path: FlatMyceliaTokenPaths): string {
  return tokenVar(path);
}
