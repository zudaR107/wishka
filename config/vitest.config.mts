import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
  },
});
