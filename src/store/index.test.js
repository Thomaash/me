import { describe, it, vi, beforeEach } from "vitest";

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

let mockCommit;
let mockStore;
let mockConfig;
let resolveReady;
let rejectReady;
let mockCreateStore;

beforeEach(() => {
  vi.resetModules();
  mockCommit = vi.fn();
  mockStore = { commit: mockCommit };
  mockConfig = { state: { loading: true } };
  mockCreateStore = vi.fn(function () {
    return mockStore;
  });

  vi.doMock("vuex", () => ({
    createStore: mockCreateStore,
  }));
});

function mockConfigWithPromise(promiseFactory) {
  vi.doMock("@/store/config", () => ({
    config: mockConfig,
    ready: promiseFactory(),
  }));
}

describe("vuex store initialization and ready lifecycle", () => {
  it("creates a Vuex store with the shared config", async ({ expect }) => {
    mockConfigWithPromise(() => new Promise(() => {}));

    const { store } = await import("@/store/index.js");

    expect(mockCreateStore).toHaveBeenCalledWith(mockConfig);
    expect(store).toBeDefined();
    expect(store.commit).toBe(mockCommit);
  });

  it("commits loaded mutation when the ready promise resolves", async ({
    expect,
  }) => {
    mockConfigWithPromise(
      () =>
        new Promise((resolve) => {
          resolveReady = resolve;
        }),
    );

    await import("@/store/index.js");

    expect(mockCommit).not.toHaveBeenCalled();

    resolveReady();
    await flushPromises();

    expect(mockCommit).toHaveBeenCalledWith("loaded");
  });

  it("logs error to console.error when the ready promise rejects", async ({
    expect,
  }) => {
    const testError = new Error("storage failure");
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockConfigWithPromise(
      () =>
        new Promise((_resolve, reject) => {
          rejectReady = reject;
        }),
    );

    await import("@/store/index.js");

    rejectReady(testError);
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      testError,
      "Failed to load store from local storage",
    );

    consoleErrorSpy.mockRestore();
  });
});
