// @vitest-environment node
import { describe, it } from "vitest";

import config from "../vitest.config.browser.js";

describe("vitest.config.browser.js test.include discovers colocated browser tests", () => {
  it("includes src/**/*.browser-test.js for colocated browser tests", ({
    expect,
  }) => {
    expect(config.test.include).toEqual(["src/**/*.browser-test.js"]);
  });
});
