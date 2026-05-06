import { describe, it, beforeEach } from "vitest";
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

/**
 * Returns a store seeded with a single host item `n1` whose hostname is `h1`.
 * Used by the many history/mutation tests that only need a minimal item graph.
 */
function seedSingleHostStore() {
  const store = useTopologyStore();
  store.data.items = createItems([["n1", { type: "host", hostname: "h1" }]]);
  return store;
}

describe("topologyStore", () => {
  // Requirement: Topology store exposes a stable public state surface
  describe("public state surface (data, past, future)", () => {
    it("initializes with topology data and empty past/future", ({ expect }) => {
      const store = useTopologyStore();
      expect(store.data).toBeDefined();
      expect(store.data.items).toBeDefined();
      expect(Object.keys(store.data.items).length).toBeGreaterThan(0);
      expect(store.past).toEqual([]);
      expect(store.future).toEqual([]);
    });

    // Pins the seeded init contract for the named-export migration: if the
    // exporter import is half-converted (e.g., topologyStore loses access to
    // importData), this assertion fails with a clear shape mismatch rather
    // than silently passing on an array-shaped items collection.
    it("seeds data.items as an object keyed by item id (internal shape)", ({
      expect,
    }) => {
      const store = useTopologyStore();
      expect(Array.isArray(store.data.items)).toBe(false);
      const ids = Object.keys(store.data.items);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(store.data.items[id].id).toBe(id);
      }
      expect(store.data).not.toHaveProperty("version");
    });
  });

  // Requirement: Topology store exposes derived values for history and layout
  describe("derived values (canUndo, canRedo, boundingBox)", () => {
    it("canUndo equals past.length after public mutations", ({ expect }) => {
      const store = seedSingleHostStore();
      expect(store.canUndo).toBe(0);

      store.updateItems([{ id: "n1", hostname: "h2" }]);
      expect(store.canUndo).toBe(store.past.length);
      expect(store.canUndo).toBe(1);

      store.updateItems([{ id: "n1", hostname: "h3" }]);
      expect(store.canUndo).toBe(store.past.length);
      expect(store.canUndo).toBe(2);
    });

    it("canRedo equals future.length after undo", ({ expect }) => {
      const store = seedSingleHostStore();
      expect(store.canRedo).toBe(0);

      store.updateItems([{ id: "n1", hostname: "h2" }]);
      store.updateItems([{ id: "n1", hostname: "h3" }]);
      store.undo();
      expect(store.canRedo).toBe(store.future.length);
      expect(store.canRedo).toBe(1);

      store.undo();
      expect(store.canRedo).toBe(store.future.length);
      expect(store.canRedo).toBe(2);
    });

    describe("boundingBox", () => {
      it("is callable", ({ expect }) => {
        const store = useTopologyStore();
        expect(typeof store.boundingBox).toBe("function");
      });

      // Scenario: Bounding box reports empty topology when no coordinates exist
      it("returns empty bounding box when no items have coordinates", ({
        expect,
      }) => {
        const store = useTopologyStore();
        store.data.items = {};
        const bb = store.boundingBox();
        expect(bb.empty).toBe(true);
      });

      // Scenario: Bounding box is computed from topology item coordinates
      it("computes bounding box from item coordinates", ({ expect }) => {
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

      it("honors margin option", ({ expect }) => {
        const store = useTopologyStore();
        store.data.items = createItems([["n1", { x: 50, y: 50 }]]);
        const bb = store.boundingBox({ margin: 10, scale: 1 });
        expect(bb.sX).toBe(40);
        expect(bb.sY).toBe(40);
        expect(bb.eX).toBe(60);
        expect(bb.eY).toBe(60);
      });

      it("honors scale option", ({ expect }) => {
        const store = useTopologyStore();
        store.data.items = createItems([
          ["n1", { x: 10, y: 20 }],
          ["n2", { x: 100, y: 200 }],
        ]);
        const bb1 = store.boundingBox({ margin: 0, scale: 1 });
        const bb2 = store.boundingBox({ margin: 0, scale: 2 });
        expect(bb2.width).toBe(bb1.width * 2);
        expect(bb2.height).toBe(bb1.height * 2);
      });
    });
  });

  // Requirement: Topology store exposes public mutation actions
  describe("public mutation actions", () => {
    describe("setValues", () => {
      it("sets data properties", ({ expect }) => {
        const store = useTopologyStore();
        store.setValues({ projectName: "Test" });
        expect(store.data.projectName).toBe("Test");
      });

      it("deletes properties with null or empty string value", ({ expect }) => {
        const store = useTopologyStore();
        store.data.projectName = "Old";
        store.setValues({ projectName: "" });
        expect(store.data.projectName).toBeUndefined();
      });
    });

    // Requirement: Topology store exposes only domain-level public mutation
    // workflows. The internal `applyChange` helper MUST NOT leak through the
    // store's public surface.
    describe("applyChange is not part of the public API", () => {
      it("does not expose applyChange on the store instance", ({ expect }) => {
        const store = useTopologyStore();
        expect(store.applyChange).toBeUndefined();
        expect(typeof store.applyChange).toBe("undefined");
      });

      it("throws on update with missing id via public replaceItems/updateItems path", ({
        expect,
      }) => {
        const store = useTopologyStore();
        expect(() => store.updateItems([{ hostname: "h1" }])).toThrow(
          "Items have to have ids.",
        );
        expect(() => store.replaceItems([{ hostname: "h1" }])).toThrow(
          "Items have to have ids.",
        );
      });
    });

    describe("removeItems", () => {
      it("removes items, appends one past entry, clears future", ({
        expect,
      }) => {
        const store = useTopologyStore();
        store.data.items = createItems([
          ["n1", { type: "host" }],
          ["n2", { type: "host" }],
        ]);
        // Seed future to verify it is cleared.
        store.updateItems([{ id: "n2", hostname: "renamed" }]);
        store.undo();
        expect(store.future).toHaveLength(1);

        const pastBefore = store.past.length;
        store.removeItems(["n1"]);

        expect(store.data.items.n1).toBeUndefined();
        expect(store.data.items.n2).toBeDefined();
        expect(store.past).toHaveLength(pastBefore + 1);
        expect(store.future).toEqual([]);
      });
    });

    describe("updateItems", () => {
      it("updates items, appends one past entry, clears future", ({
        expect,
      }) => {
        const store = seedSingleHostStore();
        store.updateItems([{ id: "n1", hostname: "tmp" }]);
        store.undo();
        expect(store.future).toHaveLength(1);

        const pastBefore = store.past.length;
        store.updateItems([{ id: "n1", hostname: "h2" }]);

        expect(store.data.items.n1.hostname).toBe("h2");
        expect(store.past).toHaveLength(pastBefore + 1);
        expect(store.future).toEqual([]);
      });
    });

    describe("replaceItems", () => {
      it("replaces items, appends one past entry, clears future", ({
        expect,
      }) => {
        const store = seedSingleHostStore();
        store.updateItems([{ id: "n1", hostname: "tmp" }]);
        store.undo();
        expect(store.future).toHaveLength(1);

        const pastBefore = store.past.length;
        store.replaceItems([{ id: "n1", type: "switch", hostname: "s1" }]);

        expect(store.data.items.n1.type).toBe("switch");
        expect(store.past).toHaveLength(pastBefore + 1);
        expect(store.future).toEqual([]);
      });
    });

    // Scenario: Public mutation actions are observable
    // Requirement: Topology store action observation reflects supported public
    // workflows. `$onAction` MUST emit for the public mutation actions and
    // MUST NOT require external consumers to observe `applyChange`.
    describe("action observers", () => {
      it("observes the public mutation workflows by their action names", ({
        expect,
      }) => {
        const store = useTopologyStore();
        store.data.items = createItems([
          ["n1", { type: "host", hostname: "h1" }],
          ["n2", { type: "host", hostname: "h2" }],
        ]);

        const observed = [];
        const unsubscribe = store.$onAction(({ name }) => {
          observed.push(name);
        });

        store.importData(exampleTiny);
        const seededId = Object.keys(store.data.items)[0];
        store.updateItems([{ id: seededId, hostname: "renamed" }]);
        store.replaceItems([
          { id: seededId, type: "host", hostname: "replaced" },
        ]);
        store.removeItems([seededId]);

        unsubscribe();

        expect(observed).toContain("importData");
        expect(observed).toContain("updateItems");
        expect(observed).toContain("replaceItems");
        expect(observed).toContain("removeItems");
        // applyChange is internal; consumers must not need to observe it.
        expect(observed).not.toContain("applyChange");
      });
    });
  });

  // Requirement: Importing topology data resets history
  describe("importData resets history", () => {
    it("replaces data and clears past and future", ({ expect }) => {
      const store = seedSingleHostStore();
      store.updateItems([{ id: "n1", hostname: "h2" }]);
      store.updateItems([{ id: "n1", hostname: "h3" }]);
      store.undo();
      expect(store.past.length).toBeGreaterThan(0);
      expect(store.future.length).toBeGreaterThan(0);

      store.importData(exampleTiny);

      expect(store.past).toEqual([]);
      expect(store.future).toEqual([]);
      expect(store.data.items).toBeDefined();
      expect(Object.keys(store.data.items).length).toBeGreaterThan(0);
    });
  });

  // Requirement: Topology mutations record undo history through public workflows
  describe("history recording through public workflows", () => {
    // Scenario: History length is capped
    it("caps past.length at MAX_UNDO_LENGTH across many public mutations", ({
      expect,
    }) => {
      const store = useTopologyStore();
      store.data.items = createItems([["n1", { type: "host", v: 0 }]]);

      for (let i = 0; i < MAX_UNDO_LENGTH + 10; i++) {
        store.updateItems([{ id: "n1", v: i }]);
      }

      expect(store.past).toHaveLength(MAX_UNDO_LENGTH);
    });
  });

  // Requirement: Undo and redo preserve observable topology behavior
  describe("undo and redo preserve observable behavior", () => {
    describe("undo", () => {
      // Scenario: Undo reverts the last public mutation
      it("reverts the last action and moves the entry to future", ({
        expect,
      }) => {
        const store = seedSingleHostStore();
        store.updateItems([{ id: "n1", hostname: "h2" }]);
        expect(store.data.items.n1.hostname).toBe("h2");
        const pastBefore = store.past.length;

        store.undo();
        expect(store.data.items.n1.hostname).toBe("h1");
        expect(store.past).toHaveLength(pastBefore - 1);
        expect(store.future).toHaveLength(1);
      });

      // Scenario: Undo fails when no history exists
      it("throws when nothing to undo", ({ expect }) => {
        const store = useTopologyStore();
        store.past.splice(0);
        expect(() => store.undo()).toThrow("Nothing to undo.");
      });
    });

    describe("redo", () => {
      // Scenario: Redo reapplies the last undone mutation
      it("reapplies the last undone action and moves the entry to past", ({
        expect,
      }) => {
        const store = seedSingleHostStore();
        store.updateItems([{ id: "n1", hostname: "h2" }]);
        store.undo();
        expect(store.data.items.n1.hostname).toBe("h1");
        const futureBefore = store.future.length;

        store.redo();
        expect(store.data.items.n1.hostname).toBe("h2");
        expect(store.future).toHaveLength(futureBefore - 1);
        expect(store.past).toHaveLength(1);
      });

      // Scenario: Redo fails when no redo history exists
      it("throws when nothing to redo", ({ expect }) => {
        const store = useTopologyStore();
        store.future.splice(0);
        expect(() => store.redo()).toThrow("Nothing to redo.");
      });
    });

    describe("integration", () => {
      it("supports multiple undo/redo cycles", ({ expect }) => {
        const store = seedSingleHostStore();

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

      // Scenario: New mutation after undo clears redo history
      it("clears future when a new action is performed after undo", ({
        expect,
      }) => {
        const store = seedSingleHostStore();

        store.updateItems([{ id: "n1", hostname: "h2" }]);
        store.undo();
        expect(store.future).toHaveLength(1);

        store.updateItems([{ id: "n1", hostname: "h3" }]);
        expect(store.future).toEqual([]);
      });

      it("handles remove and undo correctly", ({ expect }) => {
        const store = seedSingleHostStore();

        store.removeItems(["n1"]);
        expect(store.data.items.n1).toBeUndefined();

        store.undo();
        expect(store.data.items.n1).toBeDefined();
        expect(store.data.items.n1.hostname).toBe("h1");
      });
    });
  });

  describe("with medium_2_controllers data", () => {
    describe("importData", () => {
      it("loads all 176 items with correct metadata", ({ expect }) => {
        const store = seedSingleHostStore();
        store.updateItems([{ id: "n1", hostname: "h2" }]);
        store.updateItems([{ id: "n1", hostname: "h3" }]);
        store.undo();
        expect(store.past.length).toBeGreaterThan(0);
        expect(store.future.length).toBeGreaterThan(0);

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
      it("computes non-empty bounding box from real coordinates", ({
        expect,
      }) => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const bb = store.boundingBox();
        expect(bb.empty).toBe(false);
        expect(bb.width).toBeGreaterThan(0);
        expect(bb.height).toBeGreaterThan(0);
        expect(bb.sX).toBeLessThan(bb.eX);
        expect(bb.sY).toBeLessThan(bb.eY);
      });

      it("scales dimensions proportionally", ({ expect }) => {
        const store = useTopologyStore();
        store.importData(exampleMedium2Controllers);

        const bb1 = store.boundingBox({ margin: 0, scale: 1 });
        const bb2 = store.boundingBox({ margin: 0, scale: 2 });

        expect(bb2.width).toBe(bb1.width * 2);
        expect(bb2.height).toBe(bb1.height * 2);
      });
    });

    describe("removeItems", () => {
      it("removes a host and its related items, then undoes", ({ expect }) => {
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
      it("renames a controller and undoes", ({ expect }) => {
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
      it("replaces a switch entirely and undoes", ({ expect }) => {
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
      it("undoes and redoes three operations in sequence", ({ expect }) => {
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
      it("clears undo history after mutations", ({ expect }) => {
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
