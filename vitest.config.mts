import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/mycelia/**/*.test.ts"],
    exclude: ["legacy/**", "node_modules/**", ".next/**"],
    environment: "node",
    testTimeout: 30_000,
  },
});
