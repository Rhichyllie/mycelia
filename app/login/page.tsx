import type { CSSProperties } from "react";

import { myceliaVar } from "@/mycelia/runtime/ui/design-tokens";
import "@/mycelia/runtime/ui/mycelia-theme.css";

import { LoginForm } from "./login-form";

type LoginSearchParams = Promise<{
  readonly callbackUrl?: string | readonly string[];
  readonly error?: string | readonly string[];
}>;

const styles = {
  page: {
    width: myceliaVar("layout.pageWidth"),
    margin: "0 auto",
    padding: myceliaVar("layout.pagePadding"),
  },
  panel: {
    maxWidth: "460px",
    border: myceliaVar("border.subtle"),
    borderRadius: myceliaVar("radius.panel"),
    background: myceliaVar("color.bg.surface"),
    padding: myceliaVar("spacing.8"),
  },
  eyebrow: {
    margin: 0,
    color: myceliaVar("color.brand.sage"),
    font: myceliaVar("type.label"),
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: `${myceliaVar("spacing.3")} 0 ${myceliaVar("spacing.2")}`,
    color: myceliaVar("color.text.primary"),
    font: myceliaVar("type.heading1"),
  },
  copy: {
    margin: `0 0 ${myceliaVar("spacing.6")}`,
    color: myceliaVar("color.text.secondary"),
    font: myceliaVar("type.body"),
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
