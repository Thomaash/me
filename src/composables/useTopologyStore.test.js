import { describe, it, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { isRef } from "vue";
import { useTopologyStore } from "./useTopologyStore";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("useTopologyStore composable wrapper", () => {
  it("returns reactive ref-shaped values for data, past, future, canUndo, canRedo, boundingBox", ({
    expect,
  }) => {
    const wrapped = useTopologyStore();

    for (const key of [
      "data",
      "past",
      "future",
      "canUndo",
      "canRedo",
      "boundingBox",
    ]) {
      expect(isRef(wrapped[key])).toBe(true);
      // Each must expose a `.value` (computed refs do).
      expect(wrapped[key]).toHaveProperty("value");
    }
  });

  it("exposes all topology action delegates as callable functions", ({
    expect,
  }) => {
    const wrapped = useTopologyStore();
    for (const action of [
      "importData",
      "setValues",
      "applyChange",
      "removeItems",
      "updateItems",
      "replaceItems",
      "undo",
      "redo",
    ]) {
      expect(typeof wrapped[action]).toBe("function");
    }
  });

  it("removeItems through the composable updates data.value.items and adds to past.value", ({
    expect,
  }) => {
    const wrapped = useTopologyStore();

    // Seed the underlying store data through the composable's reactive surface.
    wrapped.data.value.items = {
      n1: { id: "n1", type: "host", hostname: "h1" },
      n2: { id: "n2", type: "host", hostname: "h2" },
    };
    const pastBefore = wrapped.past.value.length;

    wrapped.removeItems(["n1"]);

    expect(wrapped.data.value.items.n1).toBeUndefined();
    expect(wrapped.data.value.items.n2).toBeDefined();
    expect(wrapped.past.value.length).toBe(pastBefore + 1);
    expect(wrapped.canUndo.value).toBe(wrapped.past.value.length);
  });
});
