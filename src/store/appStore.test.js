import { describe, it, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAppStore } from "./appStore";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("appStore", () => {
  it("has correct initial state", ({ expect }) => {
    const store = useAppStore();
    expect(store.loading).toBe(true);
    expect(store.working).toBe(false);
    expect(store.isUpdateAvailable).toBe(false);
    expect(store.alert).toEqual({ show: false });
    expect(store.saveState).toBe("idle");
  });

  it("loaded sets loading to false", ({ expect }) => {
    const store = useAppStore();
    store.loaded();
    expect(store.loading).toBe(false);
  });

  describe("setWorking", () => {
    it("sets working to {curr, max} when both are numbers", ({ expect }) => {
      const store = useAppStore();
      store.setWorking({ working: true, curr: 3, max: 10 });
      expect(store.working).toEqual({ curr: 3, max: 10 });
    });

    it.for([
      ["curr is NaN", { working: true, curr: "abc", max: 10 }, true],
      ["max is NaN", { working: true, curr: 3, max: "abc" }, true],
      ["both are NaN", { working: false, curr: "a", max: "b" }, false],
      ["working is false", { working: false }, false],
    ])(
      "sets working to boolean when %s",
      ([_label, payload, expected], { expect }) => {
        const store = useAppStore();
        store.setWorking(payload);
        expect(store.working).toBe(expected);
      },
    );
  });

  it("setAlert sets alert to {show: true, type, text}", ({ expect }) => {
    const store = useAppStore();
    store.setAlert({ type: "error", text: "Something failed" });
    expect(store.alert).toEqual({
      show: true,
      type: "error",
      text: "Something failed",
    });
  });

  it("clearAlert sets alert.show to false", ({ expect }) => {
    const store = useAppStore();
    store.setAlert({ type: "error", text: "err" });
    store.clearAlert();
    expect(store.alert.show).toBe(false);
  });

  it("setUpdateAvailable sets isUpdateAvailable to true", ({ expect }) => {
    const store = useAppStore();
    store.setUpdateAvailable();
    expect(store.isUpdateAvailable).toBe(true);
  });

  describe("saveState transitions", () => {
    it.for([
      ["markPending", "pending"],
      ["markSaving", "saving"],
      ["markSaved", "idle"],
      ["markSaveError", "error"],
    ])("%s sets saveState to %s", ([action, expected], { expect }) => {
      const store = useAppStore();
      store[action]();
      expect(store.saveState).toBe(expected);
    });

    it("markSaved resets saveState to idle after a pending state", ({
      expect,
    }) => {
      const store = useAppStore();
      store.markPending();
      store.markSaving();
      store.markSaved();
      expect(store.saveState).toBe("idle");
    });
  });

  it("Pinia action observers see public app store actions by name", ({
    expect,
  }) => {
    const store = useAppStore();
    const observed = [];
    const unsubscribe = store.$onAction(({ name }) => {
      observed.push(name);
    });

    store.loaded();
    store.setWorking({ working: true });
    store.setAlert({ type: "error", text: "Something failed" });
    store.clearAlert();
    store.setUpdateAvailable();
    store.markPending();
    store.markSaving();
    store.markSaved();
    store.markSaveError();

    unsubscribe();

    expect(observed).toEqual([
      "loaded",
      "setWorking",
      "setAlert",
      "clearAlert",
      "setUpdateAvailable",
      "markPending",
      "markSaving",
      "markSaved",
      "markSaveError",
    ]);
  });
});
