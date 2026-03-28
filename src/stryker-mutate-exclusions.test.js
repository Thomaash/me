// @vitest-environment node
import { describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Stryker configs exclude browser-test files from mutation", () => {
  const strykerConfig = JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../stryker.config.json"),
      "utf-8",
    ),
  );

  const strykerBrowserConfig = JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../stryker.config.browser.json"),
      "utf-8",
    ),
  );

  it("stryker.config.json mutate array contains !src/**/*.browser-test.js exclusion", ({
    expect,
  }) => {
    expect(strykerConfig.mutate).toContain("!src/**/*.browser-test.js");
  });

  it("stryker.config.browser.json mutate array contains !src/**/*.browser-test.js exclusion", ({
    expect,
  }) => {
    expect(strykerBrowserConfig.mutate).toContain("!src/**/*.browser-test.js");
  });
});
