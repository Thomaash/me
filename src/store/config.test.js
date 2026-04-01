import { describe, it, expect, vi } from "vitest";

vi.mock("@/store/persist", () => ({
  ltm: {
    ready: Promise.resolve(),
    plugin: "mocked-ltm-plugin",
  },
}));

vi.mock("@/store/sync", () => ({
  syncPlugin: "mocked-sync-plugin",
}));

const { config } = await import("@/store/config.js");

const { mutations } = config;

describe("config store mutations", () => {
  it("loaded sets state.loading to false", ({ expect }) => {
    const state = { loading: true };
    mutations.loaded(state);
    expect(state.loading).toBe(false);
  });

  describe("setWorking", () => {
    it("sets state.working to {curr, max} object when both are numbers", ({
      expect,
    }) => {
      const state = { working: false };
      mutations.setWorking(state, { working: true, curr: 3, max: 10 });
      expect(state.working).toEqual({ curr: 3, max: 10 });
    });

    it.each([
      ["curr is NaN", { working: true, curr: "abc", max: 10 }, true],
      ["max is NaN", { working: true, curr: 3, max: "abc" }, true],
      ["both are NaN", { working: false, curr: "a", max: "b" }, false],
      ["working is false", { working: false }, false],
    ])("sets state.working to boolean when %s", (_label, payload, expected) => {
      const state = { working: !expected };
      mutations.setWorking(state, payload);
      expect(state.working).toBe(expected);
    });
  });

  it("setAlert sets state.alert to {show: true, type, text}", ({ expect }) => {
    const state = { alert: { show: false } };
    mutations.setAlert(state, { type: "error", text: "Something failed" });
    expect(state.alert).toEqual({
      show: true,
      type: "error",
      text: "Something failed",
    });
  });

  it("clearAlert sets state.alert.show to false", ({ expect }) => {
    const state = { alert: { show: true, type: "error", text: "err" } };
    mutations.clearAlert(state);
    expect(state.alert.show).toBe(false);
  });

  it("setUpdateAvailable sets state.isUpdateAvailable to true", ({
    expect,
  }) => {
    const state = { isUpdateAvailable: false };
    mutations.setUpdateAvailable(state);
    expect(state.isUpdateAvailable).toBe(true);
  });
});
