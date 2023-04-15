const { defineConfig } = require("cypress");

module.exports = defineConfig({
  defaultCommandTimeout: 15000,
  fixturesFolder: "tests/e2e/fixtures",
  screenshotOnRunFailure: false,
  screenshotsFolder: "tests/e2e/screenshots",
  video: false,
  videosFolder: "tests/e2e/videos",
  viewportHeight: 737,
  viewportWidth: 1311,

  e2e: {
    baseUrl: "http://127.0.0.1:3000",
    fixturesFolder: "tests/e2e/fixtures",
    specPattern: "tests/e2e/e2e/**/*.cy.js",
    supportFile: "tests/e2e/support/index.js",
  },

  component: {
    devServer: { bundler: "vite", framework: "vue" },
    fixturesFolder: "tests/unit/fixtures",
    indexHtmlFile: "tests/unit/support/component-index.html",
    specPattern: "tests/unit/unit/**/*.cy.js",
    supportFile: "tests/unit/support/index.js",
  },
});
