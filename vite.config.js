import { createVuePlugin } from "vite-plugin-vue2";
import { defineConfig } from "vite";
import { execSync } from "child_process";
import { promisify } from "util";
import {
  readFile as readFileCallback,
  writeFile as writeFileCallback,
} from "fs";
import { resolve } from "path";

const readFile = promisify(readFileCallback);
const writeFile = promisify(writeFileCallback);

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ["vuelidate"],
  },
  plugins: [
    createVuePlugin(),
    (function myPlugin() {
      return {
        name: "service-worker-cache-file-list",

        async closeBundle() {
          await writeFile(
            resolve(__dirname, "./dist/me/service-worker.js"),
            (
              await readFile(
                resolve(__dirname, "./dist/me/service-worker.js"),
                "utf-8"
              )
            ).replace(
              '["CACHE_URLS_PLACEHOLDER"]',
              JSON.stringify(
                await (
                  await import("globby")
                ).globby("./{assets,img}/**", {
                  cwd: resolve(__dirname, "./dist/me"),
                })
              )
            )
          );
        },
      };
    })(),
  ],
  base: "/me/",
  build: {
    manifest: true,
    outDir: resolve(__dirname, "./dist/me"),
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
    "process.env.VITE_BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.VITE_BUILD_COMMIT_HASH": JSON.stringify(
      execSync("git log -1 --format=%H", {
        encoding: "ascii",
      }).trim()
    ),
    "process.env.VITE_BUILD_COMMIT_DATE": JSON.stringify(
      new Date(
        execSync("git log -1 --format=%ct", {
          encoding: "ascii",
        }).trim() * 1000
      ).toISOString()
    ),
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "./src"),
      },
      {
        find: "vue",
        replacement: resolve(
          __dirname,
          "./node_modules/vue/dist/vue.runtime.esm.js"
        ),
      },
    ],
  },
  server: {
    host: "127.0.0.1",
  },
});
