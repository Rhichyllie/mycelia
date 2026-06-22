"use client";

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";

const INVALID_LOGIN_MESSAGE = "Invalid email or password. Try again.";

const styles = {
  form: {
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[5],
  },
  field: {
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[2],
  },
  label: {
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 800,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.bg.sunken,
    color: MYCELIA_TOKENS.color.text.primary,
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
    font: "inherit",
    outline: MYCELIA_TOKENS.border.focus,
    outlineOffset: "2px",
  },
  button: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.state.success,
    color: MYCELIA_TOKENS.color.text.inverse,
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
    font: "inherit",
    fontWeight: 900,
    cursor: "pointer",
  },
  error: {
    border: `1px solid ${MYCELIA_TOKENS.color.state.danger}`,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.intent.dangerBg,
    color: MYCELIA_TOKENS.color.text.primary,
    padding: MYCELIA_TOKENS.spacing[3],
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    lineHeight: 1.5,
  },
} satisfies Record<string, CSSProperties>;

export type LoginFormProps = {
  readonly callbackUrl: string;
  readonly initialError?: boolean;
};

function redirectAfterLogin(destination: string): void {
  window.location.assign(destination);
}

export function LoginForm({
  callbackUrl,
  initialError = false,
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(
    initialError ? INVALID_LOGIN_MESSAGE : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      redirect: false,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      callbackUrl,
    });

    setIsSubmitting(false);

    if (result?.ok) {
      redirectAfterLogin(result.url ?? callbackUrl);
      return;
    }

    setError(INVALID_LOGIN_MESSAGE);
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error ? (
        <p role="alert" style={styles.error}>
          {error}
        </p>
      ) : null}

      <label style={styles.field}>
        <span style={styles.label}>Email</span>
        <input
          autoComplete="email"
          name="email"
          required
          style={styles.input}
          type="email"
        />
      </label>

      <label style={styles.field}>
        <span style={styles.label}>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          required
          style={styles.input}
          type="password"
        />
      </label>

      <button disabled={isSubmitting} style={styles.button} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export { INVALID_LOGIN_MESSAGE };
