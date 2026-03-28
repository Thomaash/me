/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: "no-orphans",
      comment:
        "This is a restatement of the default no-orphans rule from recommended-strict, with src/test-setup-unit.js excluded. That file is referenced by Vitest as a setup file (via vitest config), but dependency-cruiser cannot detect that relationship automatically.",
      severity: "error",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$",
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "(^|/)(babel|webpack)\\.config\\.(js|cjs|mjs|ts|json)$",
          "^src/test-setup-unit\\.js$",
        ],
      },
      to: {},
    },
    {
      name: "not-to-test",
      comment:
        "This module depends on code within a folder that should only contain tests. As tests don't implement functionality this is odd. Either you're writing a test outside the test folder or there's something in the test folder that isn't a test.",
      severity: "error",
      from: {
        pathNot: "^(tests)",
      },
      to: {
        path: "^(tests)",
      },
    },
    {
      name: "not-to-spec",
      comment:
        "This module depends on a spec (test) file. The sole responsibility of a spec file is to test code. If there's something in a spec that's of use to other modules, it doesn't have that single responsibility anymore. Factor it out into (e.g.) a separate utility/ helper or a mock.",
      severity: "error",
      from: {},
      to: {
        path: "\\.(spec|test)\\.(js|mjs|cjs|ts|ls|coffee|litcoffee|coffee\\.md)$",
      },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment:
        "This module depends on an npm package from the 'devDependencies' section of your package.json. It looks like something that ships to production, though. To prevent problems with npm packages that aren't there on production declare it (only!) in the 'dependencies' section of your package.json. If this module is development only - add it to the from.pathNot re of the not-to-dev-dep rule in the dependency-cruiser configuration",
      from: {
        path: "^(src)",
        pathNot: [
          "\\.(spec|test|browser-test)\\.(js|mjs|cjs|ts|ls|coffee|litcoffee|coffee\\.md)$",
          "/test-utils/",
        ],
      },
      to: {
        dependencyTypes: ["npm-dev"],
      },
    },
    {
      name: "not-to-peer-etc",
      comment:
        "Only dependencies (what is deployed) and devDependencies (develompent tools) make sense in this package.",
      severity: "error",
      from: {},
      to: {
        dependencyTypes: ["npm-peer", "npm-optional"],
      },
    },
  ],
  extends: ["dependency-cruiser/configs/recommended-strict"],
  options: {
    doNotFollow: {
      path: ["/generated/", "(^|/)node_modules/"],
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/(@[^/]+/[^/]+|[^/]+)",
      },
      archi: {
        collapsePattern:
          "^(packages|src|lib|app|bin|test(s?)|spec(s?))/[^/]+|node_modules/(@[^/]+/[^/]+|[^/]+)",
      },
      text: {
        highlightFocused: true,
      },
    },
    webpackConfig: {
      fileName: "./.dependency-cruiser.webpack.config.js",
    },
  },
};
