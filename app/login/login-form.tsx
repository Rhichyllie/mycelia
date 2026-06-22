"use client";

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { myceliaVar } from "@/mycelia/runtime/ui/design-tokens";

const INVALID_LOGIN_MESSAGE = "Invalid email or password. Try again.";

const styles = {
  form: {
    display: "grid",
    gap: myceliaVar("spacing.5"),
  },
  field: {
    display: "grid",
    gap: myceliaVar("spacing.2"),
  },
  label: {
    color: myceliaVar("color.text.secondary"),
    font: myceliaVar("type.bodySmall"),
    fontWeight: 800,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: myceliaVar("border.subtle"),
    borderRadius: myceliaVar("radius.md"),
    background: myceliaVar("color.bg.sunken"),
    color: myceliaVar("color.text.primary"),
    padding: `${myceliaVar("spacing.3")} ${myceliaVar("spacing.4")}`,
    font: "inherit",
    outline: myceliaVar("border.focus"),
    outlineOffset: "2px",
  },
  button: {
    border: myceliaVar("border.subtle"),
    borderRadius: myceliaVar("radius.md"),
    background: myceliaVar("color.state.success"),
    color: myceliaVar("color.text.inverse"),
    padding: `${myceliaVar("spacing.3")} ${myceliaVar("spacing.4")}`,
    font: "inherit",
    fontWeight: 900,
    cursor: "pointer",
  },
  error: {
    border: `1px solid ${myceliaVar("color.state.danger")}`,
    borderRadius: myceliaVar("radius.md"),
    background: myceliaVar("color.intent.dangerBg"),
    color: myceliaVar("color.text.primary"),
    padding: myceliaVar("spacing.3"),
    font: myceliaVar("type.bodySmall"),
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
