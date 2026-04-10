import { describe, it, vi, beforeEach } from "vitest";

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

let mockLoaded;
let resolveReady;
let rejectReady;

beforeEach(() => {
  vi.resetModules();
  mockLoaded = vi.fn();

  vi.doMock("@/store/pinia", () => ({
    pinia: {},
  }));

  vi.doMock("@/store/appStore", () => ({
    useAppStore: () => ({
      loaded: mockLoaded,
    }),
  }));

  vi.doMock("@/store/topologyStore", () => ({
    useTopologyStore: () => ({}),
  }));
});

function mockReadyWithPromise(promiseFactory) {
  vi.doMock("@/store/persist", () => ({
    ready: promiseFactory(),
  }));
}

describe("store initialization and ready lifecycle", () => {
  it("calls appStore.loaded() when the ready promise resolves", async ({
    expect,
  }) => {
    mockReadyWithPromise(
      () =>
        new Promise((resolve) => {
          resolveReady = resolve;
        }),
    );

    const { initStores } = await import("@/store/index.js");
    initStores();

    expect(mockLoaded).not.toHaveBeenCalled();

    resolveReady();
    await flushPromises();

    expect(mockLoaded).toHaveBeenCalled();
  });

  it("logs error to console.error when the ready promise rejects", async ({
    expect,
  }) => {
    const testError = new Error("storage failure");
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockReadyWithPromise(
      () =>
        new Promise((_resolve, reject) => {
          rejectReady = reject;
        }),
    );

    const { initStores } = await import("@/store/index.js");
    initStores();

    rejectReady(testError);
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      testError,
      "Failed to load store from local storage",
    );

    consoleErrorSpy.mockRestore();
  });
});
