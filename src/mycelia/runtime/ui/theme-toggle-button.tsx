"use client";

import type { CSSProperties } from "react";
import { useSyncExternalStore } from "react";

import { myceliaVar } from "./design-tokens";

type MyceliaTheme = "dark" | "light";

const THEME_STORAGE_KEY = "mycelia-theme";
const THEME_CHANGE_EVENT = "mycelia-theme-change";

const styles = {
  button: {
    border: myceliaVar("border.subtle"),
    borderRadius: myceliaVar("radius.md"),
    background: myceliaVar("color.bg.panel"),
    color: myceliaVar("color.text.secondary"),
    padding: `${myceliaVar("spacing.2")} ${myceliaVar("spacing.3")}`,
    font: myceliaVar("type.bodySmall"),
    fontWeight: 800,
    cursor: "pointer",
  },
} satisfies Record<string, CSSProperties>;

function isMyceliaTheme(value: string | null | undefined): value is MyceliaTheme {
  return value === "dark" || value === "light";
}

function nextTheme(theme: MyceliaTheme): MyceliaTheme {
  return theme === "dark" ? "light" : "dark";
}

function resolveBrowserTheme(): MyceliaTheme {
  const documentTheme = document.documentElement.getAttribute("data-theme");

  if (isMyceliaTheme(documentTheme)) {
    return documentTheme;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (isMyceliaTheme(storedTheme)) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function persistTheme(theme: MyceliaTheme): void {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribeToThemeChange(onStoreChange: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function ThemeToggleButton({
  initialTheme = "dark",
}: {
  readonly initialTheme?: MyceliaTheme;
}) {
  const theme = useSyncExternalStore(
    subscribeToThemeChange,
    resolveBrowserTheme,
    () => initialTheme,
  );
  const targetTheme = nextTheme(theme);

  function handleToggle(): void {
    persistTheme(targetTheme);
  }

  return (
    <button
      aria-label={`Switch to ${targetTheme} theme`}
      onClick={handleToggle}
      style={styles.button}
      type="button"
    >
      Theme: {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
