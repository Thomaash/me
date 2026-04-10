import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTopologyStore, MAX_UNDO_LENGTH } from "./topologyStore";
import exampleMedium2Controllers from "@/examples/medium_2_controllers";
import exampleTiny from "@/examples/tiny";

beforeEach(() => {
  setActivePinia(createPinia());
});

function createItems(entries) {
  return Object.fromEntries(
    entries.map(([id, props]) => [id, { id, ...props }]),
  );
}

describe("topologyStore", () => {
  describe("initial state", () => {
    it("has data, past, and future", () => {
      const store = useTopologyStore();
      expect(store.data).toBeDefined();
      expect(store.data.items).toBeDefined();
      expect(store.past).toEqual([]);
      expect(store.future).toEqual([]);
    });
  });

  describe("getters", () => {
    it("canUndo returns past length", () => {
      const store = useTopologyStore();
      expect(store.canUndo).toBe(0);
      store.past.push(["entry"]);
      expect(store.canUndo).toBe(1);
    });

    it("canRedo returns future length", () => {
      const store = useTopologyStore();
      expect(store.canRedo).toBe(0);
      store.future.push(["entry"]);
      expect(store.canRedo).toBe(1);
    });

    describe("boundingBox", () => {
      it("returns a function", () => {
        const store = useTopologyStore();
        expect(typeof store.boundingBox).toBe("function");
      });

      it("returns empty bounding box when no items have coordinates", () => {
        const store = useTopologyStore();
        store.data.items = {};
        const bb = store.boundingBox();
        expect(bb.empty).toBe(true);
      });

      it("computes bounding box from item coordinates", () => {
        const store = useTopologyStore();
        store.data.items = createItems([
          ["n1", { x: 10, y: 20 }],
          ["n2", { x: 100, y: 200 }],
        ]);
        const bb = store.boundingBox({ margin: 0, scale: 1 });
        expect(bb.sX).toBe(10);
        expect(bb.sY).toBe(20);
        expect(bb.eX).toBe(100);
        expect(bb.eY).toBe(200);
        expect(bb.width).toBe(90);
        expect(bb.height).toBe(180);
      });

      it("applies margin", () => {
        const store = useTopologyStore();
        store.data.items = createItems([["n1", { x: 50, y: 50 }]]);
        const bb = store.boundingBox({ margin: 10, scale: 1 });
        expect(bb.sX).toBe(40);
        expect(bb.sY).toBe(40);
        expect(bb.eX).toBe(60);
        expect(bb.eY).toBe(60);
      });
    });
  });

  describe("importData", () => {
    it("replaces all data and clears undo/redo", () => {
      const store = useTopologyStore();
      store.past.push(["a"]);
      store.future.push(["b"]);

      store.importData(exampleTiny);

      expect(store.past).toEqual([]);
      expect(store.future).toEqual([]);
      expect(store.data.items).toBeDefined();
      expect(Object.keys(store.data.items).length).toBeGreaterThan(0);
    });
  });

  describe("setValues", () => {
    it("sets data properties", () => {
      const store = useTopologyStore();
      store.setValues({ projectName: "Test" });
      expect(store.data.projectName).toBe("Test");
    });

    it("deletes properties with null or empty string value", () => {
      const store = useTopologyStore();
      store.data.projectName = "Old";
      store.setValues({ projectName: "" });
      expect(store.data.projectName).toBeUndefined();
    });
  });

  describe("applyChange", () => {
    it("removes items by id", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host" }],
        ["n2", { type: "host" }],
      ]);
      store.applyChange({ remove: ["n1"] });
      expect(store.data.items.n1).toBeUndefined();
      expect(store.data.items.n2).toBeDefined();
    });

    it("updates items in place", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);
      store.applyChange({ update: [{ id: "n1", hostname: "h2" }] });
      expect(store.data.items.n1.hostname).toBe("h2");
      expect(store.data.items.n1.type).toBe("host");
    });

    it("replaces items entirely", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);
      store.applyChange({
        replace: [{ id: "n1", type: "switch", hostname: "s1" }],
      });
      expect(store.data.items.n1).toEqual({
        id: "n1",
        type: "switch",
        hostname: "s1",
      });
    });

    it("throws when update item has no id", () => {
      const store = useTopologyStore();
      expect(() => store.applyChange({ update: [{ hostname: "h1" }] })).toThrow(
        "Items have to have ids.",
      );
    });

    it("throws when replace item has no id", () => {
      const store = useTopologyStore();
      expect(() =>
        store.applyChange({ replace: [{ hostname: "h1" }] }),
      ).toThrow("Items have to have ids.");
    });
  });

  describe("_pushChange", () => {
    it("adds to past and clears future", () => {
      const store = useTopologyStore();
      store.future.push(["old"]);
      store._pushChange([{ before: "a", after: "b" }]);
      expect(store.past).toHaveLength(1);
      expect(store.future).toHaveLength(0);
    });

    it("limits past to MAX_UNDO_LENGTH", () => {
      const store = useTopologyStore();
      for (let i = 0; i < MAX_UNDO_LENGTH + 10; i++) {
        store._pushChange([{ before: `${i}`, after: `${i + 1}` }]);
      }
      expect(store.past.length).toBeLessThanOrEqual(MAX_UNDO_LENGTH);
    });
  });

  describe("_undoShift", () => {
    it("moves last past entry to future", () => {
      const store = useTopologyStore();
      store.past.push("a", "b");
      store._undoShift();
      expect(store.past).toEqual(["a"]);
      expect(store.future).toEqual(["b"]);
    });

    it("does nothing when past is empty", () => {
      const store = useTopologyStore();
      store._undoShift();
      expect(store.past).toEqual([]);
      expect(store.future).toEqual([]);
    });
  });

  describe("_redoShift", () => {
    it("moves last future entry to past", () => {
      const store = useTopologyStore();
      store.future.push("a", "b");
      store._redoShift();
      expect(store.past).toEqual(["b"]);
      expect(store.future).toEqual(["a"]);
    });

    it("does nothing when future is empty", () => {
      const store = useTopologyStore();
      store._redoShift();
      expect(store.past).toEqual([]);
      expect(store.future).toEqual([]);
    });
  });

  describe("removeItems", () => {
    it("removes items and records undo entry", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host" }],
        ["n2", { type: "host" }],
      ]);
      store.removeItems(["n1"]);
      expect(store.data.items.n1).toBeUndefined();
      expect(store.data.items.n2).toBeDefined();
      expect(store.past).toHaveLength(1);
    });
  });

  describe("updateItems", () => {
    it("updates items and records undo entry", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);
      store.updateItems([{ id: "n1", hostname: "h2" }]);
      expect(store.data.items.n1.hostname).toBe("h2");
      expect(store.past).toHaveLength(1);
    });
  });

  describe("replaceItems", () => {
    it("replaces items and records undo entry", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);
      store.replaceItems([{ id: "n1", type: "switch", hostname: "s1" }]);
      expect(store.data.items.n1.type).toBe("switch");
      expect(store.past).toHaveLength(1);
    });
  });

  describe("undo", () => {
    it("undoes the last action", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);
      store.updateItems([{ id: "n1", hostname: "h2" }]);
      expect(store.data.items.n1.hostname).toBe("h2");

      store.undo();
      expect(store.data.items.n1.hostname).toBe("h1");
      expect(store.future).toHaveLength(1);
    });

    it("throws when nothing to undo", () => {
      const store = useTopologyStore();
      expect(() => store.undo()).toThrow("Nothing to undo.");
    });
  });

  describe("redo", () => {
    it("redoes the last undone action", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);
      store.updateItems([{ id: "n1", hostname: "h2" }]);
      store.undo();
      expect(store.data.items.n1.hostname).toBe("h1");

      store.redo();
      expect(store.data.items.n1.hostname).toBe("h2");
    });

    it("throws when nothing to redo", () => {
      const store = useTopologyStore();
      expect(() => store.redo()).toThrow("Nothing to redo.");
    });
  });

  describe("undo/redo integration", () => {
    it("supports multiple undo/redo cycles", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);

      store.updateItems([{ id: "n1", hostname: "h2" }]);
      store.updateItems([{ id: "n1", hostname: "h3" }]);

      store.undo();
      expect(store.data.items.n1.hostname).toBe("h2");

      store.undo();
      expect(store.data.items.n1.hostname).toBe("h1");

      store.redo();
      expect(store.data.items.n1.hostname).toBe("h2");

      store.redo();
      expect(store.data.items.n1.hostname).toBe("h3");
    });

    it("clears future when new action is performed after undo", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);

      store.updateItems([{ id: "n1", hostname: "h2" }]);
      store.undo();
      expect(store.future).toHaveLength(1);

      store.updateItems([{ id: "n1", hostname: "h3" }]);
      expect(store.future).toHaveLength(0);
    });

    it("handles remove and undo correctly", () => {
      const store = useTopologyStore();
      store.data.items = createItems([
        ["n1", { type: "host", hostname: "h1" }],
      ]);

      store.removeItems(["n1"]);
      expect(store.data.items.n1).toBeUndefined();

      store.undo();
      expect(store.data.items.n1).toBeDefined();
      expect(store.data.items.n1.hostname).toBe("h1");
    });
  });

  describe("with medium_2_controllers data", () => {
    describe("importData", () => {
      it("loads all 176 items with correct metadata", () => {
        const store = useTopologyStore();
        store.past.push(["dummy"]);
        store.future.push(["dummy"]);

        store.importData(exampleMedium2Controllers);

        expect(Object.keys(store.data.items)).toHaveLength(176);
        expect(store.data.projectName).toBe(
          "Mininet network - Medium with 2 controllers",
        );
        expect(store.data.startScript).toBe(
          "# Ping between all hosts.\npingall\n",
        );
        expect(store.past).toEqual([]);
        expect(store.future).toEqual([]);
      });
    });

    describe("boundingBox", () => {
      it("computes non-empty bounding box from real coordinates", () => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const bb = store.boundingBox();
        expect(bb.empty).toBe(false);
        expect(bb.width).toBeGreaterThan(0);
        expect(bb.height).toBeGreaterThan(0);
        expect(bb.sX).toBeLessThan(bb.eX);
        expect(bb.sY).toBeLessThan(bb.eY);
      });

      it("scales dimensions proportionally", () => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const bb1 = store.boundingBox({ margin: 0, scale: 1 });
        const bb2 = store.boundingBox({ margin: 0, scale: 2 });

        expect(bb2.width).toBe(bb1.width * 2);
        expect(bb2.height).toBe(bb1.height * 2);
      });
    });

    describe("removeItems", () => {
      it("removes a host and its related items, then undoes", () => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const hostId = "0d651e75-aa02-43b6-b281-f2ea01b475b9";
        const assocId = "3a0c702a-9044-469a-ba11-f83f1193a111";
        const portId = "1cddc061-24c9-4793-9815-e65e472ca648";

        const originalHost = { ...store.data.items[hostId] };
        const originalAssoc = { ...store.data.items[assocId] };
        const originalPort = { ...store.data.items[portId] };

        store.removeItems([hostId, assocId, portId]);

        expect(store.data.items[hostId]).toBeUndefined();
        expect(store.data.items[assocId]).toBeUndefined();
        expect(store.data.items[portId]).toBeUndefined();
        expect(Object.keys(store.data.items)).toHaveLength(173);
        expect(store.past).toHaveLength(1);

        store.undo();

        expect(store.data.items[hostId]).toEqual(originalHost);
        expect(store.data.items[assocId]).toEqual(originalAssoc);
        expect(store.data.items[portId]).toEqual(originalPort);
        expect(Object.keys(store.data.items)).toHaveLength(176);
      });
    });

    describe("updateItems", () => {
      it("renames a controller and undoes", () => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const controllerId = "c7140bf4-cd87-48b6-b1fa-f75e42776c1c";
        const switchId = "a41e6c27-1729-425c-b390-87890ed26014";
        const hostId = "0d651e75-aa02-43b6-b281-f2ea01b475b9";

        store.updateItems([{ id: controllerId, hostname: "c1-renamed" }]);

        expect(store.data.items[controllerId].hostname).toBe("c1-renamed");
        expect(store.data.items[controllerId].type).toBe("controller");
        expect(store.data.items[switchId].hostname).toBe("s1");
        expect(store.data.items[hostId].hostname).toBe("h2");
        expect(store.past).toHaveLength(1);

        store.undo();

        expect(store.data.items[controllerId].hostname).toBe("c1");
      });
    });

    describe("replaceItems", () => {
      it("replaces a switch entirely and undoes", () => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const switchId = "a41e6c27-1729-425c-b390-87890ed26014";
        const originalSwitch = JSON.parse(
          JSON.stringify(store.data.items[switchId]),
        );

        store.replaceItems([
          { id: switchId, type: "switch", hostname: "s1-replaced", custom: 42 },
        ]);

        expect(store.data.items[switchId]).toEqual({
          id: switchId,
          type: "switch",
          hostname: "s1-replaced",
          custom: 42,
        });
        expect(store.data.items[switchId].x).toBeUndefined();
        expect(store.past).toHaveLength(1);

        store.undo();

        expect(store.data.items[switchId]).toEqual(originalSwitch);
      });
    });

    describe("multiple operations then undo/redo", () => {
      it("undoes and redoes three operations in sequence", () => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const hostId = "0d651e75-aa02-43b6-b281-f2ea01b475b9";
        const controllerId = "c7140bf4-cd87-48b6-b1fa-f75e42776c1c";
        const switchId = "a41e6c27-1729-425c-b390-87890ed26014";

        const originalSwitch = JSON.parse(
          JSON.stringify(store.data.items[switchId]),
        );

        // Three operations
        store.removeItems([hostId]);
        expect(store.past).toHaveLength(1);

        store.updateItems([{ id: controllerId, hostname: "c1-changed" }]);
        expect(store.past).toHaveLength(2);

        store.replaceItems([
          { id: switchId, type: "switch", hostname: "s1-new" },
        ]);
        expect(store.past).toHaveLength(3);

        // Undo all three
        store.undo();
        expect(store.data.items[switchId]).toEqual(originalSwitch);

        store.undo();
        expect(store.data.items[controllerId].hostname).toBe("c1");

        store.undo();
        expect(store.data.items[hostId]).toBeDefined();
        expect(Object.keys(store.data.items)).toHaveLength(176);

        // Redo all three
        store.redo();
        expect(store.data.items[hostId]).toBeUndefined();

        store.redo();
        expect(store.data.items[controllerId].hostname).toBe("c1-changed");

        store.redo();
        expect(store.data.items[switchId].hostname).toBe("s1-new");

        // Nothing left to redo
        expect(() => store.redo()).toThrow("Nothing to redo.");
      });
    });

    describe("re-import", () => {
      it("clears undo history after mutations", () => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const hostId = "0d651e75-aa02-43b6-b281-f2ea01b475b9";
        const controllerId = "c7140bf4-cd87-48b6-b1fa-f75e42776c1c";

        store.removeItems([hostId]);
        store.updateItems([{ id: controllerId, hostname: "changed" }]);
        store.undo();
        expect(store.past).toHaveLength(1);
        expect(store.future).toHaveLength(1);

        store.importData(exampleMedium2Controllers);

        expect(store.past).toEqual([]);
        expect(store.future).toEqual([]);
        expect(Object.keys(store.data.items)).toHaveLength(176);
        expect(store.data.items[hostId]).toBeDefined();
        expect(store.data.items[controllerId].hostname).toBe("c1");
      });
    });
  });
});
