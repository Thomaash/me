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
  },
});
