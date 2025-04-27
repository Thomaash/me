module.exports = {
  root: true,
  env: {
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
  },
  globals: {
    module: "writable",
    process: "readonly",
  },
  extends: ["plugin:vue/recommended", "eslint:recommended", "@vue/prettier"],
  plugins: ["vue", "prettier"],
  rules: {
    "no-debugger": "error",
  },
  overrides: [
    {
      files: ["./src/**", "./tests/**"],
      env: {
        browser: true,
      },
    },
    {
      files: ["./tests/**"],
      globals: {
        Cypress: "readonly",
        cy: "readonly",
      },
    },
    {
      files: ["./*.*", "./.*.*"],
      env: {
        node: true,
      },
    },
  ],
};
