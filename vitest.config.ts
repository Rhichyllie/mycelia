import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    exclude: ["legacy/**", "node_modules/**", ".next/**"],
  },
});
