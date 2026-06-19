import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProductSurfaceShell } from "@/mycelia/ui-surfaces/product-surface-shell";

export const metadata: Metadata = {
  title: "MYCELIA",
  description:
    "Governed operational intelligence and read-only descriptor-level demo surfaces.",
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProductSurfaceShell>{children}</ProductSurfaceShell>
      </body>
    </html>
  );
}
