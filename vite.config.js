import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import createVuePlugin from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { defineConfig } from "vite";
import { globby } from "globby";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    createVuePlugin(),
    vuetify({ autoImport: true }),
    (function myPlugin() {
      return {
        name: "service-worker-cache-file-list",

        async closeBundle() {
          await writeFile(
            resolve(import.meta.dirname, "./dist/me/service-worker.js"),
            (
              await readFile(
                resolve(import.meta.dirname, "./dist/me/service-worker.js"),
                "utf-8",
              )
            ).replace(
              '["CACHE_URLS_PLACEHOLDER"]',
              JSON.stringify(
                await globby("./{assets,img}/**", {
                  cwd: resolve(import.meta.dirname, "./dist/me"),
                }),
              ),
            ),
          );
        },
      };
    })(),
  ],
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
  port: 5173,
  base: "/me/",
  build: {
    manifest: true,
    outDir: resolve(import.meta.dirname, "./dist/me"),
    rollupOptions: {
      input: {
        app: "./index.html",
        "service-worker": "./src/service-worker/index.js",
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === "service-worker"
            ? "service-worker.js"
            : "assets/js/[name]-[hash].js";
        },
      },
    },
  },
  define: {
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(
      new Date().toISOString(),
    ),
    "import.meta.env.VITE_BUILD_COMMIT_HASH": JSON.stringify(
      execSync("git log -1 --format=%H", {
        encoding: "ascii",
      }).trim(),
    ),
    "import.meta.env.VITE_BUILD_COMMIT_DATE": JSON.stringify(
      new Date(
        execSync("git log -1 --format=%ct", {
          encoding: "ascii",
        }).trim() * 1000,
      ).toISOString(),
    ),
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(import.meta.dirname, "./src"),
      },
    ],
  },
  server: {
    host: "127.0.0.1",
  },
});
