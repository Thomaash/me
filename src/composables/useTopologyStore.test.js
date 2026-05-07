import { describe, it, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTopologyStore as useRawTopologyStore } from "@/store/topologyStore";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("useTopologyStore raw Pinia store", () => {
  it("removeItems updates data.items and adds to past", ({ expect }) => {
    const store = useRawTopologyStore();

    store.data.items = {
      n1: { id: "n1", type: "host", hostname: "h1" },
      n2: { id: "n2", type: "host", hostname: "h2" },
    };
    const pastBefore = store.past.length;

    store.removeItems(["n1"]);

    expect(store.data.items.n1).toBeUndefined();
    expect(store.data.items.n2).toBeDefined();
    expect(store.past.length).toBe(pastBefore + 1);
    expect(store.canUndo).toBe(store.past.length);
  });

  it("undo restores removed items and updates future", ({ expect }) => {
    const store = useRawTopologyStore();

    store.data.items = {
      n1: { id: "n1", type: "host", hostname: "h1" },
      n2: { id: "n2", type: "host", hostname: "h2" },
    };

    store.removeItems(["n1"]);
    expect(store.data.items.n1).toBeUndefined();
    expect(store.past.length).toBe(1);
    expect(store.future.length).toBe(0);

    store.undo();

    expect(store.data.items.n1).toBeDefined();
    expect(store.data.items.n1.id).toBe("n1");
    expect(store.past.length).toBe(0);
    expect(store.future.length).toBe(1);
  });

  it("redo re-applies removed items and updates past", ({ expect }) => {
    const store = useRawTopologyStore();

    store.data.items = {
      n1: { id: "n1", type: "host", hostname: "h1" },
      n2: { id: "n2", type: "host", hostname: "h2" },
    };

    store.removeItems(["n1"]);
    store.undo();
    expect(store.data.items.n1).toBeDefined();
    expect(store.future.length).toBe(1);

    store.redo();

    expect(store.data.items.n1).toBeUndefined();
    expect(store.past.length).toBe(1);
    expect(store.future.length).toBe(0);
  });

  it("updateItems modifies existing items and adds to past", ({ expect }) => {
    const store = useRawTopologyStore();

    store.data.items = {
      n1: { id: "n1", type: "host", hostname: "h1" },
    };
    const pastBefore = store.past.length;

    store.updateItems([{ id: "n1", hostname: "updated" }]);

    expect(store.data.items.n1.hostname).toBe("updated");
    expect(store.data.items.n1.type).toBe("host");
    expect(store.past.length).toBe(pastBefore + 1);
  });

  it("replaceItems replaces existing items and adds to past", ({ expect }) => {
    const store = useRawTopologyStore();

    store.data.items = {
      n1: { id: "n1", type: "host", hostname: "h1" },
    };
    const pastBefore = store.past.length;

    store.replaceItems([{ id: "n1", type: "router", hostname: "new" }]);

    expect(store.data.items.n1.type).toBe("router");
    expect(store.data.items.n1.hostname).toBe("new");
    expect(store.past.length).toBe(pastBefore + 1);
  });

  it("setValues sets top-level data properties", ({ expect }) => {
    const store = useRawTopologyStore();

    store.setValues({ foo: "bar" });

    expect(store.data.foo).toBe("bar");
  });

  it("importData replaces all data and clears undo history", ({ expect }) => {
    const store = useRawTopologyStore();

    store.data.items = { n1: { id: "n1" } };
    store.data.foo = "bar";
    store.removeItems(["n1"]);
    expect(store.past.length).toBeGreaterThan(0);

    const newData = { version: 0, items: [{ id: "n2" }], baz: "qux" };
    store.importData(newData);

    expect(store.data.items).toEqual({ n2: { id: "n2" } });
    expect(store.data.baz).toBe("qux");
    expect(store.data.foo).toBeUndefined();
    expect(store.past.length).toBe(0);
    expect(store.future.length).toBe(0);
  });

  it("does not expose applyChange on the raw store", ({ expect }) => {
    const store = useRawTopologyStore();
    expect(store.applyChange).toBeUndefined();
    expect("applyChange" in store).toBe(false);
  });
});
