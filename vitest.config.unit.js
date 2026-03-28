import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import createVuePlugin from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
  plugins: [createVuePlugin(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup-unit.js"],
    include: ["src/**/*.test.js", "coverage-*.test.js"],
    testTimeout: 10000,
    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "reports/coverage/unit",
      exclude: ["src/importScript/generated/**", "src/examples/*.json"],
    },
  },
});
