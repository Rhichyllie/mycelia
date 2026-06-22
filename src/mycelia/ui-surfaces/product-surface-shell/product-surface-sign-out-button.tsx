"use client";

import type { CSSProperties } from "react";
import { signOut } from "next-auth/react";

import { MYCELIA_TOKENS } from "../../runtime/ui/design-tokens";

const styles = {
  button: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.bg.sunken,
    color: MYCELIA_TOKENS.color.text.secondary,
    padding: "7px 9px",
    font: "inherit",
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 800,
    cursor: "pointer",
  },
} satisfies Record<string, CSSProperties>;

export function ProductSurfaceSignOutButton() {
  return (
    <button
      onClick={() => {
        void signOut({ callbackUrl: "/login" });
      }}
      style={styles.button}
      type="button"
    >
      Sign out
    </button>
  );
}
