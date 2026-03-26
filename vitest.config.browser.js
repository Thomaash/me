import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import createVuePlugin from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
  plugins: [createVuePlugin(), vuetify({ autoImport: true })],
  define: {
    "process.env.VITE_BUILD_DATE": JSON.stringify("2026-01-15T00:00:00.000Z"),
    "process.env.VITE_BUILD_COMMIT_HASH": JSON.stringify("abc123def456"),
    "process.env.VITE_BUILD_COMMIT_DATE": JSON.stringify(
      "2026-01-14T00:00:00.000Z",
    ),
  },
  optimizeDeps: {
    include: [
      "vuetify/components/VAlert",
      "vuetify/components/VApp",
      "vuetify/components/VAppBar",
      "vuetify/components/VBtn",
      "vuetify/components/VCard",
      "vuetify/components/VCheckbox",
      "vuetify/components/VDataTable",
      "vuetify/components/VDialog",
      "vuetify/components/VFab",
      "vuetify/components/VForm",
      "vuetify/components/VGrid",
      "vuetify/components/VIcon",
      "vuetify/components/VList",
      "vuetify/components/VMain",
      "vuetify/components/VMenu",
      "vuetify/components/VNavigationDrawer",
      "vuetify/components/VProgressCircular",
      "vuetify/components/VProgressLinear",
      "vuetify/components/VSelect",
      "vuetify/components/VSnackbar",
      "vuetify/components/VSpeedDial",
      "vuetify/components/VSwitch",
      "vuetify/components/VTextField",
      "vuetify/components/VTextarea",
      "vuetify/components/VToolbar",
      "vuetify/components/transitions",
    ],
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.browser-test.js"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "reports/coverage/browser",
    },
  },
});
