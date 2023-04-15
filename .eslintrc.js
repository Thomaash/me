module.exports = {
  root: true,
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
        es2021: true,
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
        es2021: true,
        node: true,
      },
    },
  ],
};
