import { describe, it, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTopologyStore } from "./topologyStore";

beforeEach(() => {
  setActivePinia(createPinia());
});

// Requirement: Topology store exposes a stable public state surface
// These tests pin the state-shape contract that persist.js depends on.
// They do NOT exercise the persist plugin directly (which would touch
// localforage and BroadcastChannel); they only assert the invariants
// persist.js reads from and writes to the store: the JSON snapshot of
// `store.$state` for `localforage.setItem`, and `store.$patch` for restore.
describe("persist.js state-shape contract", () => {
  // Scenario: Store state can be restored through Pinia patching
  it("exposes data, past, and future on $state so persist can serialize", ({
    expect,
  }) => {
    const store = useTopologyStore();
    const snapshot = JSON.parse(JSON.stringify(store.$state));
    expect(Object.prototype.hasOwnProperty.call(snapshot, "data")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(snapshot, "past")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(snapshot, "future")).toBe(true);
  });

  // Scenario: Store state can be restored through Pinia patching
  it("applies restored topology state through $patch with Object.assign", ({
    expect,
  }) => {
    const store = useTopologyStore();

    const restoredData = {
      projectName: "Restored",
      items: { r1: { id: "r1", type: "host", hostname: "rh1" } },
    };
    const restoredPast = [
      [{ before: JSON.stringify({ id: "x" }), after: JSON.stringify(null) }],
    ];
    const restoredFuture = [
      [{ before: JSON.stringify(null), after: JSON.stringify({ id: "y" }) }],
    ];

    // Mirrors the call site in persist.js exactly:
    //   store.$patch((state) => Object.assign(state, saved.topology));
    store.$patch((state) =>
      Object.assign(state, {
        data: restoredData,
        past: restoredPast,
        future: restoredFuture,
      }),
    );

    expect(store.data.projectName).toBe("Restored");
    expect(store.data.items.r1.hostname).toBe("rh1");
    expect(store.past).toEqual(restoredPast);
    expect(store.future).toEqual(restoredFuture);
    expect(store.canUndo).toBe(restoredPast.length);
    expect(store.canRedo).toBe(restoredFuture.length);
  });

  // persist.js calls
  //   await storage.setItem(STORAGE_KEY, {
  //     topology: JSON.parse(JSON.stringify(store.$state)),
  //   });
  // This test pins the contract that the JSON snapshot persist.js writes
  // contains plain serializable values for `data.items`, `past`, and `future`,
  // so the round-trip through localforage and `$patch` restores correctly.
  it("JSON snapshot of $state exposes plain values for data, past, future", ({
    expect,
  }) => {
    const store = useTopologyStore();
    store.$patch((state) =>
      Object.assign(state, {
        data: { items: { n1: { id: "n1", type: "host", hostname: "h1" } } },
        past: [],
        future: [],
      }),
    );

    store.updateItems([{ id: "n1", hostname: "h2" }]);

    const snapshot = JSON.parse(JSON.stringify(store.$state));
    expect(snapshot.data.items.n1.hostname).toBe("h2");
    expect(snapshot.past).toHaveLength(1);
    expect(snapshot.future).toEqual([]);
  });
});
