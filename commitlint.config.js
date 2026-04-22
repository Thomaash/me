export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow arbitrary body line length — commit messages often include URLs
    // that easily exceed 100 characters.
    "body-max-line-length": [0],
  },
};
