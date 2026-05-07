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
    suspicious: "error",
  },
  rules: {
    "oxc/no-map-spread": "off",
    "eslint/no-await-in-loop": "off",
    "eslint/no-shadow": "off",
    "import/no-unassigned-import": "off",
    "typescript/no-extraneous-class": "off",
    "eslint/no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "vitest",
            importNames: ["expect"],
            message:
              "Destructure `expect` from the test callback context instead of importing it from `vitest`. The context-bound form helps concurrent tests attribute failures to the correct test.",
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ["src/**/*.js"],
      rules: {
        "import/no-default-export": "error",
      },
    },
  ],
});
