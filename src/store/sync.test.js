import { describe, it, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTopologyStore } from "./topologyStore";

beforeEach(() => {
  setActivePinia(createPinia());
});

// Requirement: Topology store exposes public mutation actions
// sync.js replays cross-tab messages via `store[action](...args)`.
// These tests pin the contract sync.js reads: each public action name
// MUST be a callable function on the store. We do NOT exercise the
// BroadcastChannel path here (that is platform-level wiring).
describe("sync.js action-replay contract", () => {
  const PUBLIC_ACTIONS = [
    "importData",
    "setValues",
    "removeItems",
    "updateItems",
    "replaceItems",
    "undo",
    "redo",
  ];

  // Scenario: Public actions remain callable by store consumers
  it("exposes every required public action name as a callable function on the store", ({
    expect,
  }) => {
    const store = useTopologyStore();
    for (const action of PUBLIC_ACTIONS) {
      expect(typeof store[action]).toBe("function");
    }
  });

  // Scenario: Internal helper is not part of observable public contract
  it("does not expose the internal applyChange helper on the store", ({
    expect,
  }) => {
    const store = useTopologyStore();
    expect(store.applyChange).toBeUndefined();
  });

  // Scenario: Action observers can react to public topology mutations
  it("$onAction observes removeItems by its public name (sync replay observation)", ({
    expect,
  }) => {
    const store = useTopologyStore();
    store.data.items = {
      n1: { id: "n1", type: "host", hostname: "h1" },
    };

    const observed = [];
    const unsubscribe = store.$onAction(({ name, args }) => {
      observed.push({ name, args });
    });

    store.removeItems(["n1"]);

    unsubscribe();

    expect(observed.some(({ name }) => name === "removeItems")).toBe(true);
    const removeCall = observed.find(({ name }) => name === "removeItems");
    expect(removeCall.args).toEqual([["n1"]]);
  });

  it("replaying an action through store[action](...args) updates state (sync.js code path)", ({
    expect,
  }) => {
    const store = useTopologyStore();
    store.data.items = {
      n1: { id: "n1", type: "host", hostname: "h1" },
    };

    // Mirrors sync.js: store[action](...args)
    const action = "updateItems";
    const args = [[{ id: "n1", hostname: "renamed" }]];
    store[action](...args);

    expect(store.data.items.n1.hostname).toBe("renamed");
  });
});
