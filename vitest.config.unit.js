import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import createVuePlugin from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [createVuePlugin()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.js", "coverage-*.test.js"],
    coverage: {
      provider: "v8",
      reportsDirectory: "reports/coverage/unit",
      exclude: ["src/importScript/generated/**", "src/examples/*.json"],
    },
  },
});
