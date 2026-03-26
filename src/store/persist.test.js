import { describe, it, vi } from "vitest";

const mockExecuteWithDelay = vi.fn(() => "execute-with-delay-result");
const mockMutationFilter = vi.fn(() => "mutation-filter-result");
const mockLocalForage = vi.fn(() => "local-forage-result");
const mockShallowMerge = "shallow-merge-sentinel";
const mockToRaw = vi.fn((v) => v);

let ltmConstructorArgs;

vi.mock("vuex-ltm", () => {
  class MockLTM {
    constructor(options) {
      ltmConstructorArgs = options;
    }
  }
  return {
    LTM: MockLTM,
    executeWithDelay: mockExecuteWithDelay,
    mutationFilter: mockMutationFilter,
    shallowMerge: mockShallowMerge,
    localForage: mockLocalForage,
  };
});

vi.mock("vue", () => ({
  toRaw: mockToRaw,
}));

const { ltm } = await import("@/store/persist.js");

describe("vuex-ltm persistence initialization", () => {
  it("exports ltm as an instance of LTM", async ({ expect }) => {
    const { LTM } = await import("vuex-ltm");
    expect(ltm).toBeInstanceOf(LTM);
  });

  it("configures executeWithDelay with 2000ms delay", ({ expect }) => {
    expect(mockExecuteWithDelay).toHaveBeenCalledWith(2000);
    expect(ltmConstructorArgs.execute).toBe("execute-with-delay-result");
  });

  it("configures mutationFilter targeting topology/ prefix", ({ expect }) => {
    expect(mockMutationFilter).toHaveBeenCalledWith([/^topology\//]);
    expect(ltmConstructorArgs.filter).toBe("mutation-filter-result");
  });

  it("configures shallowMerge as the merge strategy", ({ expect }) => {
    expect(ltmConstructorArgs.merge).toBe(mockShallowMerge);
  });

  it("configures localForage storage with store name vuex-me", ({ expect }) => {
    expect(mockLocalForage).toHaveBeenCalledWith("vuex-me", {
      name: "Vuex",
      version: 1.0,
      storeName: "vuex-me",
    });
    expect(ltmConstructorArgs.storage).toBe("local-forage-result");
  });

  it("configures reduce to extract only topology from state", ({ expect }) => {
    const topology = { nodes: [1, 2], edges: [{ from: 1, to: 2 }] };
    const mockState = { topology, other: "data", settings: { theme: "dark" } };
    const result = ltmConstructorArgs.reduce(mockState);

    expect(result).toEqual({ topology });
    expect(Object.keys(result)).toEqual(["topology"]);
  });
});
