// @vitest-environment node
import { describe, it } from "vitest";

import config from "./vitest.config.browser.js";

describe.concurrent(
  "browser coverage config uses v8 provider and reports to reports/coverage/browser",
  () => {
    it("configures v8 as the coverage provider", ({ expect }) => {
      expect(config.test.coverage.provider).toBe("v8");
    });

    it("sets reportsDirectory to reports/coverage/browser", ({ expect }) => {
      expect(config.test.coverage.reportsDirectory).toBe(
        "reports/coverage/browser",
      );
    });

    it("uses a different reportsDirectory than the unit coverage config", ({
      expect,
    }) => {
      expect(config.test.coverage.reportsDirectory).not.toBe(
        "reports/coverage/unit",
      );
    });
  },
);

describe("browser config permits file-level parallel execution", () => {
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
