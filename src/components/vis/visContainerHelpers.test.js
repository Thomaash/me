import { describe, it } from "vitest";
import {
  orderNodes,
  getEdgeType,
  isEdgeValid,
  generateOrganizedPortCoors,
  getNextHostname,
} from "@/components/vis/visContainerHelpers.js";

describe.concurrent("visContainerHelpers", () => {
  describe("orderNodes", () => {
    it("swaps from/to when source priority is higher than destination", ({
      expect,
    }) => {
      const items = {
        p1: { type: "port" },
        s1: { type: "switch" },
      };
      const edge = { from: "p1", to: "s1" };
      orderNodes(edge, items);

      expect(edge.from).toBe("s1");
      expect(edge.to).toBe("p1");
    });

    it("does not swap when source priority is lower than destination", ({
      expect,
    }) => {
      const items = {
        s1: { type: "switch" },
        p1: { type: "port" },
      };
      const edge = { from: "s1", to: "p1" };
      orderNodes(edge, items);

      expect(edge.from).toBe("s1");
      expect(edge.to).toBe("p1");
    });

    it("does not swap when both endpoints have equal priority", ({
      expect,
    }) => {
      const items = {
        p1: { type: "port" },
        p2: { type: "port" },
      };
      const edge = { from: "p1", to: "p2" };
      orderNodes(edge, items);

      expect(edge.from).toBe("p1");
      expect(edge.to).toBe("p2");
    });
  });

  describe("getEdgeType", () => {
    it("returns 'link' for port-to-port edges with no existing item", ({
      expect,
    }) => {
      const items = {
        p1: { type: "port" },
        p2: { type: "port" },
      };
      const edge = { from: "p1", to: "p2" };

      expect(getEdgeType(edge, items)).toBe("link");
    });

    it("returns 'association' for non-port-to-port edges", ({ expect }) => {
      const items = {
        s1: { type: "switch" },
        p1: { type: "port" },
      };
      const edge = { from: "s1", to: "p1" };

      expect(getEdgeType(edge, items)).toBe("association");
    });

    it("returns the existing item's type when the edge id is present", ({
      expect,
    }) => {
      const items = {
        p1: { type: "port" },
        p2: { type: "port" },
        e1: { type: "association" },
      };
      const edge = { id: "e1", from: "p1", to: "p2" };

      expect(getEdgeType(edge, items)).toBe("association");
    });
  });

  describe("isEdgeValid", () => {
    it("accepts a port-to-port link", ({ expect }) => {
      const items = {
        p1: { type: "port" },
        p2: { type: "port" },
      };

      expect(isEdgeValid({ from: "p1", to: "p2" }, "link", items)).toBe(true);
    });

    it("rejects a non-port-to-port link", ({ expect }) => {
      const items = {
        s1: { type: "switch" },
        p1: { type: "port" },
      };

      expect(isEdgeValid({ from: "s1", to: "p1" }, "link", items)).toBe(false);
    });

    it("accepts controller-to-switch and switch-to-port associations", ({
      expect,
    }) => {
      const items = {
        c1: { type: "controller" },
        s1: { type: "switch" },
        p1: { type: "port" },
        h1: { type: "host" },
      };

      expect(isEdgeValid({ from: "c1", to: "s1" }, "association", items)).toBe(
        true,
      );
      expect(isEdgeValid({ from: "s1", to: "p1" }, "association", items)).toBe(
        true,
      );
      expect(isEdgeValid({ from: "h1", to: "p1" }, "association", items)).toBe(
        true,
      );
    });

    it("accepts dummy as a source for any association", ({ expect }) => {
      const items = {
        d1: { type: "dummy" },
        s1: { type: "switch" },
      };

      expect(isEdgeValid({ from: "d1", to: "s1" }, "association", items)).toBe(
        true,
      );
    });

    it("rejects unsupported association combinations", ({ expect }) => {
      const items = {
        h1: { type: "host" },
        s1: { type: "switch" },
      };

      expect(isEdgeValid({ from: "h1", to: "s1" }, "association", items)).toBe(
        false,
      );
    });
  });

  describe("generateOrganizedPortCoors", () => {
    it("places <=8 ports on a single row at y + 70 with 50px spacing", ({
      expect,
    }) => {
      const result = generateOrganizedPortCoors({ x: 0, y: 0 }, 4);

      expect(result).toHaveLength(4);
      expect(result.every((c) => c.y === 70)).toBe(true);
      // firstX = 0 - (3 * 50) / 2 = -75
      expect(result.map((c) => c.x)).toEqual([-75, -25, 25, 75]);
    });

    it("staggers >8 ports vertically and uses 30px horizontal spacing", ({
      expect,
    }) => {
      const result = generateOrganizedPortCoors({ x: 0, y: 0 }, 10);

      expect(result).toHaveLength(10);
      // even indices (0, 2, 4, ...) get the +25 yEvenOffset
      expect(result[0].y).toBe(95);
      expect(result[1].y).toBe(70);
      expect(result[2].y).toBe(95);
      // firstX = 0 - (9 * 30) / 2 = -135
      expect(result[0].x).toBe(-135);
      expect(result[1].x).toBe(-105);
    });

    it("respects the supplied center coordinates", ({ expect }) => {
      const result = generateOrganizedPortCoors({ x: 100, y: 200 }, 2);

      expect(result).toEqual([
        { x: 75, y: 270 },
        { x: 125, y: 270 },
      ]);
    });
  });

  describe("getNextHostname", () => {
    it("returns the fallback when the hostname list is empty", ({ expect }) => {
      expect(getNextHostname([], "h1")).toBe("h1");
    });

    it("increments the numeric segment of the highest hostname", ({
      expect,
    }) => {
      expect(getNextHostname(["h1", "h2", "h3"], "h1")).toBe("h4");
    });

    it("preserves prefix and suffix around the numeric segment", ({
      expect,
    }) => {
      expect(getNextHostname(["eth0", "eth1"], "eth0")).toBe("eth2");
    });

    it("returns the fallback when the highest label has no numeric segment", ({
      expect,
    }) => {
      expect(getNextHostname(["alpha"], "h1")).toBe("h1");
    });
  });
});
