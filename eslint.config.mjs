import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import configPrettier from "eslint-config-prettier/flat";
import globals from "globals";
import js from "@eslint/js";
import pluginCypress from "eslint-plugin-cypress/flat";
import pluginImport from "eslint-plugin-import";
import pluginNode from "eslint-plugin-n";
import pluginPromise from "eslint-plugin-promise";
import pluginVue from "eslint-plugin-vue";
import { includeIgnoreFile } from "@eslint/compat";

import viteConfig from "./vite.config.js";

export default [
  includeIgnoreFile(
    resolve(dirname(fileURLToPath(import.meta.url)), ".gitignore"),
  ),

  js.configs.recommended,
  pluginImport.flatConfigs.recommended,
  pluginPromise.configs["flat/recommended"],
  pluginCypress.configs.recommended,
  ...pluginVue.configs["flat/recommended"],

  {
    rules: {
      "promise/always-return": "off",
    },
  },

  {
    files: ["src/**", "tests/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        process: true,
      },
    },
    settings: {
      "import/extensions": [".js", ".vue"],
      "import/parsers": {
        "vue-eslint-parser": [".vue"],
      },
      "import/resolver": {
        exports: {},
        vite: {
          viteConfig,
        },
      },
    },
    rules: {
      "import/no-unresolved": [
        "error",
        {
          ignore: [
            // Queries don't work with these resolvers.
            /\?raw/.source,
          ],
        },
      ],
    },
  },

  {
    ...pluginNode.configs["flat/recommended-script"],
    ignores: ["src/**", "tests/**"],
  },
  {
    ignores: ["src/**", "tests/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    settings: {
      "import/resolver": {
        exports: {},
        node: {
          extensions: [".js"],
        },
      },
      "import/extensions": [".js"],
    },
  },

  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },

  configPrettier,

  {
    ignores: ["**/generated/**"],
  },
];
