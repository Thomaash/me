import { defineConfig } from "oxlint";

export default defineConfig({
  $schema: "./node_modules/oxlint/configuration_schema.json",
  ignorePatterns: ["src/importScript/generated/**"],
  plugins: [
    "eslint",
    "import",
    "oxc",
    "promise",
    "typescript",
    "unicorn",
    "vue",
  ],
  categories: {
    correctness: "error",
    perf: "error",
  },
  rules: {
    "oxc/no-map-spread": "off",
    "eslint/no-await-in-loop": "off",
  },
});
