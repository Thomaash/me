import { describe, it, vi } from "vitest";

let sharerConfig;
const mockPlugin = vi.fn();

vi.mock("vuex-shared-mutations", () => ({
  default: vi.fn((config) => {
    sharerConfig = config;
    return mockPlugin;
  }),
}));

const { syncPlugin } = await import("@/store/sync.js");

describe("vuex-shared-mutations sync plugin", () => {
  it("exports syncPlugin as the return value of createMutationsSharer", ({
    expect,
  }) => {
    expect(syncPlugin).toBe(mockPlugin);
    expect(typeof syncPlugin).toBe("function");
  });

  it("configures predicate to sync all mutations regardless of type", ({
    expect,
  }) => {
    expect(sharerConfig.predicate()).toBe(true);
    expect(sharerConfig.predicate("any-mutation")).toBe(true);
    expect(sharerConfig.predicate(null)).toBe(true);
  });
});
