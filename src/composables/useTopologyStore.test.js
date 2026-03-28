import { describe, it, expect, vi } from "vitest";
import { useTopologyStore } from "./useTopologyStore";

const mockCommit = vi.fn();
const mockDispatch = vi.fn();
const mockSubscribe = vi.fn();

vi.mock("vuex", () => ({
  useStore: () => ({
    state: {
      loading: false,
      working: true,
      alert: { show: true, type: "info", text: "test" },
      isUpdateAvailable: false,
    },
    getters: {
      "topology/data": { items: { h1: { type: "host" } } },
      "topology/canUndo": 2,
      "topology/canRedo": 1,
      "topology/boundingBox": () => ({ width: 100, height: 200 }),
    },
    commit: mockCommit,
    dispatch: mockDispatch,
    subscribe: mockSubscribe,
  }),
}));

describe("useTopologyStore", () => {
  it("provides reactive access to topology data", () => {
    const { data } = useTopologyStore();
    expect(data.value).toEqual({ items: { h1: { type: "host" } } });
  });

  it("provides reactive access to canUndo", () => {
    const { canUndo } = useTopologyStore();
    expect(canUndo.value).toBe(2);
  });

  it("provides reactive access to canRedo", () => {
    const { canRedo } = useTopologyStore();
    expect(canRedo.value).toBe(1);
  });

  it("provides reactive access to loading", () => {
    const { loading } = useTopologyStore();
    expect(loading.value).toBe(false);
  });

  it("provides reactive access to working", () => {
    const { working } = useTopologyStore();
    expect(working.value).toBe(true);
  });

  it("provides reactive access to alert", () => {
    const { alert } = useTopologyStore();
    expect(alert.value).toEqual({ show: true, type: "info", text: "test" });
  });

  it("provides reactive access to isUpdateAvailable", () => {
    const { isUpdateAvailable } = useTopologyStore();
    expect(isUpdateAvailable.value).toBe(false);
  });

  it("provides reactive access to boundingBox", () => {
    const { boundingBox } = useTopologyStore();
    expect(boundingBox.value).toBeTypeOf("function");
    expect(boundingBox.value()).toEqual({ width: 100, height: 200 });
  });

  it("setWorking commits setWorking mutation", () => {
    mockCommit.mockClear();
    const { setWorking } = useTopologyStore();
    setWorking({ working: true });
    expect(mockCommit).toHaveBeenCalledWith("setWorking", { working: true });
  });

  it("setAlert commits setAlert mutation", () => {
    mockCommit.mockClear();
    const { setAlert } = useTopologyStore();
    setAlert({ type: "error", text: "fail" });
    expect(mockCommit).toHaveBeenCalledWith("setAlert", {
      type: "error",
      text: "fail",
    });
  });

  it("clearAlert commits clearAlert mutation", () => {
    mockCommit.mockClear();
    const { clearAlert } = useTopologyStore();
    clearAlert();
    expect(mockCommit).toHaveBeenCalledWith("clearAlert");
  });

  it("dispatch dispatches namespaced topology action", () => {
    mockDispatch.mockClear();
    const { dispatch } = useTopologyStore();
    dispatch("updateItems", [{ id: "h1" }]);
    expect(mockDispatch).toHaveBeenCalledWith("topology/updateItems", [
      { id: "h1" },
    ]);
  });

  it("commitTopology commits namespaced topology mutation", () => {
    mockCommit.mockClear();
    const { commitTopology } = useTopologyStore();
    commitTopology("setValues", { projectName: "test" });
    expect(mockCommit).toHaveBeenCalledWith("topology/setValues", {
      projectName: "test",
    });
  });

  it("importData commits topology/importData mutation", () => {
    mockCommit.mockClear();
    const { importData } = useTopologyStore();
    importData({ items: {} });
    expect(mockCommit).toHaveBeenCalledWith("topology/importData", {
      items: {},
    });
  });

  it("subscribe delegates to store.subscribe", () => {
    mockSubscribe.mockClear();
    const { subscribe } = useTopologyStore();
    const fn = vi.fn();
    subscribe(fn);
    expect(mockSubscribe).toHaveBeenCalledWith(fn);
  });
});
