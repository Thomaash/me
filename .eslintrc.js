module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    parser: "@babel/eslint-parser",
    sourceType: "module",
  },
  globals: {
    module: "writable",
    process: "readonly",
  },
  extends: ["plugin:vue/recommended", "eslint:recommended", "@vue/prettier"],
  plugins: ["vue", "prettier"],
  rules: {
    // allow debugger during development
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
  },
  overrides: [
    {
      files: ["./src/**", "./tests/**"],
      env: {
        browser: true,
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
