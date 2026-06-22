import type { CSSProperties } from "react";

import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";

import { LoginForm } from "./login-form";

type LoginSearchParams = Promise<{
  readonly callbackUrl?: string | readonly string[];
  readonly error?: string | readonly string[];
}>;

const styles = {
  page: {
    width: MYCELIA_TOKENS.layout.pageWidth,
    margin: "0 auto",
    padding: MYCELIA_TOKENS.layout.pagePadding,
  },
  panel: {
    maxWidth: "460px",
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.surface,
    padding: MYCELIA_TOKENS.spacing[8],
  },
  eyebrow: {
    margin: 0,
    color: MYCELIA_TOKENS.color.brand.sage,
    fontSize: MYCELIA_TOKENS.type.label,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: `${MYCELIA_TOKENS.spacing[3]} 0 ${MYCELIA_TOKENS.spacing[2]}`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.heading1,
    lineHeight: 1.05,
  },
  copy: {
    margin: `0 0 ${MYCELIA_TOKENS.spacing[6]}`,
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.body,
    lineHeight: 1.6,
  },
} satisfies Record<string, CSSProperties>;

function firstParam(value: string | readonly string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeCallbackUrl(value: string | readonly string[] | undefined) {
  const callbackUrl = firstParam(value)?.trim();

  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/mycelia";
  }

  return callbackUrl;
}

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams?: LoginSearchParams;
}) {
  const resolvedSearchParams =
    searchParams === undefined ? undefined : await searchParams;

  return (
    <main style={styles.page}>
      <section aria-labelledby="login-title" style={styles.panel}>
        <p style={styles.eyebrow}>Secure access</p>
        <h1 id="login-title" style={styles.title}>
          Sign in to MYCELIA
        </h1>
        <p style={styles.copy}>
          Use your local demo credentials to enter the governed workspace.
        </p>
        <LoginForm
          callbackUrl={safeCallbackUrl(resolvedSearchParams?.callbackUrl)}
          initialError={Boolean(firstParam(resolvedSearchParams?.error))}
        />
      </section>
    </main>
  );
}
