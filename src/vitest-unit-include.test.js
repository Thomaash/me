// @vitest-environment node
import { describe, it } from "vitest";

import config from "../vitest.config.unit.js";

describe("vitest.config.unit.js test.include discovers colocated and root-level tests", () => {
  it("includes src/**/*.test.js for colocated tests and coverage-*.test.js for root-level tests", ({
    expect,
  }) => {
    expect(config.test.include).toEqual([
      "src/**/*.test.js",
      "coverage-*.test.js",
    ]);
  });
});
