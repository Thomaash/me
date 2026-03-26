// @vitest-environment node
import { describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import config from "./vitest.config.unit.js";

describe.concurrent("unit coverage config uses v8 provider and reports to reports/coverage/unit", () => {
  it("configures v8 as the coverage provider", ({ expect }) => {
    expect(config.test.coverage.provider).toBe("v8");
  });

  it("sets reportsDirectory to reports/coverage/unit", ({ expect }) => {
    expect(config.test.coverage.reportsDirectory).toBe("reports/coverage/unit");
  });
});

describe("package.json contains coverage npm scripts", () => {
  const packageJson = JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "./package.json"),
      "utf-8",
    ),
  );
  const scripts = packageJson.scripts;

  it("has test:vitest:unit:coverage script with unit config and --coverage flag", ({ expect }) => {
    expect(scripts["test:vitest:unit:coverage"]).toBeDefined();
    expect(scripts["test:vitest:unit:coverage"]).toContain(
      "vitest.config.unit.js",
    );
    expect(scripts["test:vitest:unit:coverage"]).toContain("--coverage");
  });

  it("has test:vitest:browser:coverage script with browser config and --coverage flag", ({ expect }) => {
    expect(scripts["test:vitest:browser:coverage"]).toBeDefined();
    expect(scripts["test:vitest:browser:coverage"]).toContain(
      "vitest.config.browser.js",
    );
    expect(scripts["test:vitest:browser:coverage"]).toContain("--coverage");
  });
});

describe("coverage config excludes generated parser files and example data from reporting", () => {
  it("excludes ANTLR-generated parser files from coverage", ({ expect }) => {
    expect(config.test.coverage.exclude).toContain(
      "src/importScript/generated/**",
    );
  });

  it("excludes example data files from coverage", ({ expect }) => {
    expect(config.test.coverage.exclude).toContain("src/examples/*.json");
  });
});

describe("unit config permits file-level parallel execution", () => {
  it("does not disable fileParallelism", ({ expect }) => {
    expect(config.test.fileParallelism).not.toBe(false);
  });

  it("does not set singleThread to true", ({ expect }) => {
    expect(config.test.singleThread).not.toBe(true);
  });

  it("does not set sequence.concurrent to false", ({ expect }) => {
    const sequence = config.test.sequence;
    if (sequence) {
      expect(sequence.concurrent).not.toBe(false);
    }
  });
});

describe("gitignore excludes coverage reports directory", () => {
  const gitignoreContent = readFileSync(
    resolve(import.meta.dirname, "./.gitignore"),
    "utf-8",
  );

  it("contains reports/coverage/ entry to exclude generated coverage artifacts", ({ expect }) => {
    const lines = gitignoreContent
      .split("\n")
      .map((line) => line.trim());
    expect(lines).toContain("reports/coverage/");
  });
});
