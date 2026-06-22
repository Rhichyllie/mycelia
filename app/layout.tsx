import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

import { ProductSurfaceShell } from "@/mycelia/ui-surfaces/product-surface-shell";
import "@/mycelia/runtime/ui/mycelia-theme.css";

export const metadata: Metadata = {
  title: "MYCELIA",
  description:
    "Governed operational intelligence with a local SQLite-backed governed-run demo loop.",
};

export const MYCELIA_THEME_INIT_SCRIPT = `
(() => {
  try {
    const storageKey = "mycelia-theme";
    const storedTheme = localStorage.getItem(storageKey);
    const isStoredTheme = storedTheme === "light" || storedTheme === "dark";
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = isStoredTheme ? storedTheme : prefersLight ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html data-theme="dark" lang="en" suppressHydrationWarning>
      <body>
        <Script id="mycelia-theme-init" strategy="beforeInteractive">
          {MYCELIA_THEME_INIT_SCRIPT}
        </Script>
        <ProductSurfaceShell>{children}</ProductSurfaceShell>
      </body>
    </html>
  );
}
