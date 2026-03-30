import { describe, it, expect } from "vitest";
import Items from "@/builder/Items.js";

// --- Test Fixtures ---

function makeItem(overrides) {
  return { id: "id-1", type: "host", hostname: "h1", ...overrides };
}

function buildFixtureItems() {
  return [
    {
      id: "c1",
      type: "controller",
      hostname: "ctrl0",
      from: undefined,
      to: undefined,
    },
    { id: "h1", type: "host", hostname: "h1", from: undefined, to: undefined },
    { id: "h2", type: "host", hostname: "h2", from: undefined, to: undefined },
    {
      id: "s1",
      type: "switch",
      hostname: "s1",
      from: undefined,
      to: undefined,
    },
    { id: "p1", type: "port", hostname: "p1", from: undefined, to: undefined },
    { id: "l1", type: "link", hostname: "link1", from: "h1", to: "s1" },
    { id: "a1", type: "association", hostname: "assoc1", from: "c1", to: "s1" },
  ];
}

describe.concurrent("Items", () => {
  describe("map categorization", () => {
    it("places all items into map.$all keyed by id", ({ expect }) => {
      const input = buildFixtureItems();
      const items = new Items(input);

      expect(Object.keys(items.map.$all)).toHaveLength(input.length);
      input.forEach(({ id }) => {
        expect(items.map.$all[id]).toBeDefined();
        expect(items.map.$all[id].id).toBe(id);
      });
    });

    it("places only link and association items into map.$edges", ({
      expect,
    }) => {
      const items = new Items(buildFixtureItems());

      const edgeIds = Object.keys(items.map.$edges);
      expect(edgeIds).toHaveLength(2);
      expect(items.map.$edges["l1"].type).toBe("link");
      expect(items.map.$edges["a1"].type).toBe("association");
    });

    it("places non-edge items into map.$nodes with relationship arrays", ({
      expect,
    }) => {
      const items = new Items(buildFixtureItems());

      const nodeIds = Object.keys(items.map.$nodes);
      expect(nodeIds).toHaveLength(5);
      expect(items.map.$nodes["l1"]).toBeUndefined();
      expect(items.map.$nodes["a1"]).toBeUndefined();

      nodeIds.forEach((id) => {
        const node = items.map.$nodes[id];
        expect(Array.isArray(node.$associations)).toBe(true);
        expect(Array.isArray(node.$edges)).toBe(true);
        expect(Array.isArray(node.$links)).toBe(true);
      });

      // Nodes with no connections have empty arrays
      const p1 = items.map.$nodes["p1"];
      expect(p1.$associations).toEqual([]);
      expect(p1.$edges).toEqual([]);
      expect(p1.$links).toEqual([]);
    });

    it.each([
      ["controller", ["c1"]],
      ["host", ["h1", "h2"]],
      ["switch", ["s1"]],
      ["port", ["p1"]],
      ["link", ["l1"]],
      ["association", ["a1"]],
    ])("groups %s items into map.%s", (type, expectedIds) => {
      const items = new Items(buildFixtureItems());

      const ids = Object.keys(items.map[type]);
      expect(ids).toEqual(expectedIds);
      ids.forEach((id) => {
        expect(items.map[type][id].type).toBe(type);
      });
    });
  });

  describe("arr sorting", () => {
    it("sorts arr.$all by hostname using en-US numeric collation", ({
      expect,
    }) => {
      const input = [
        makeItem({ id: "a", hostname: "z10" }),
        makeItem({ id: "b", hostname: "z2" }),
        makeItem({ id: "c", hostname: "a1" }),
      ];
      const items = new Items(input);

      const hostnames = items.arr.$all.map((i) => i.hostname);
      expect(hostnames).toEqual(["a1", "z2", "z10"]);
    });

    it.each(["$all", "$edges", "$nodes", "host", "link"])(
      "produces arr.%s as a sorted array matching map.%s values",
      (key) => {
        const items = new Items(buildFixtureItems());

        expect(Array.isArray(items.arr[key])).toBe(true);
        expect(items.arr[key]).toHaveLength(Object.keys(items.map[key]).length);

        for (let i = 1; i < items.arr[key].length; i++) {
          const prev = items.arr[key][i - 1].hostname;
          const curr = items.arr[key][i].hostname;
          const collator = new Intl.Collator("en-US-u-kn");
          expect(collator.compare(prev, curr)).toBeLessThanOrEqual(0);
        }
      },
    );
  });

  describe("edge-node relationship wiring", () => {
    it("populates edge.$nodes with from and to node references", ({
      expect,
    }) => {
      const items = new Items(buildFixtureItems());

      const link = items.map.$edges["l1"];
      expect(link.$nodes).toHaveLength(2);
      expect(link.$nodes[0].id).toBe("h1");
      expect(link.$nodes[1].id).toBe("s1");

      const assoc = items.map.$edges["a1"];
      expect(assoc.$nodes).toHaveLength(2);
      expect(assoc.$nodes[0].id).toBe("c1");
      expect(assoc.$nodes[1].id).toBe("s1");
    });

    it("populates node.$edges with all connected edges", ({ expect }) => {
      const items = new Items(buildFixtureItems());

      // s1 is connected to both l1 (link) and a1 (association)
      const s1 = items.map.$nodes["s1"];
      expect(s1.$edges).toHaveLength(2);
      expect(s1.$edges.map((e) => e.id).toSorted()).toEqual(["a1", "l1"]);

      // h1 is connected to l1 only
      const h1 = items.map.$nodes["h1"];
      expect(h1.$edges).toHaveLength(1);
      expect(h1.$edges[0].id).toBe("l1");
    });

    it("populates node.$links with connected link edges only", ({ expect }) => {
      const items = new Items(buildFixtureItems());

      const s1 = items.map.$nodes["s1"];
      expect(s1.$links).toHaveLength(1);
      expect(s1.$links[0].id).toBe("l1");
      expect(s1.$links[0].type).toBe("link");

      const h1 = items.map.$nodes["h1"];
      expect(h1.$links).toHaveLength(1);
      expect(h1.$links[0].id).toBe("l1");
    });

    it("populates node.$associations with connected association edges only", ({
      expect,
    }) => {
      const items = new Items(buildFixtureItems());

      const s1 = items.map.$nodes["s1"];
      expect(s1.$associations).toHaveLength(1);
      expect(s1.$associations[0].id).toBe("a1");
      expect(s1.$associations[0].type).toBe("association");

      const c1 = items.map.$nodes["c1"];
      expect(c1.$associations).toHaveLength(1);
      expect(c1.$associations[0].id).toBe("a1");
    });
  });

  describe("numeric-aware collation", () => {
    it("sorts hostnames numerically so item2 comes before item10", ({
      expect,
    }) => {
      const input = [
        makeItem({ id: "a", hostname: "item10" }),
        makeItem({ id: "b", hostname: "item2" }),
        makeItem({ id: "c", hostname: "item1" }),
      ];
      const items = new Items(input);

      const hostnames = items.arr.$all.map((i) => i.hostname);
      // With en-US-u-kn (numeric collation): item1, item2, item10
      // With empty string collator: item1, item10, item2 (lexicographic)
      expect(hostnames).toEqual(["item1", "item2", "item10"]);
    });
  });

  describe("data immutability", () => {
    it("does not modify original input items via Object.create", ({
      expect,
    }) => {
      const input = buildFixtureItems();
      const frozen = input.map((item) => ({ ...item }));

      const _items = new Items(input);

      input.forEach((item, i) => {
        expect(item).toEqual(frozen[i]);
        expect(item.$edges).toBeUndefined();
        expect(item.$links).toBeUndefined();
        expect(item.$associations).toBeUndefined();
        expect(item.$nodes).toBeUndefined();
      });
    });
  });

  describe("dynamic type maps", () => {
    it("creates map entries for types not in the predefined set", ({
      expect,
    }) => {
      const input = [makeItem({ id: "x1", type: "router", hostname: "r1" })];
      const items = new Items(input);

      expect(items.map.router).toBeDefined();
      expect(items.map.router["x1"].type).toBe("router");
      expect(items.map.$nodes["x1"]).toBeDefined();
    });
  });
});
