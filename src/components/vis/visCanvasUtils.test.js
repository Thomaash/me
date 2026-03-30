import { describe, it } from "vitest";
import {
  isEdge,
  buildGroupColor,
  itemToNode,
  itemToEdge,
  processLabel,
} from "@/components/vis/visCanvasUtils.js";

const processLabelFn = () => "processed-label";

describe.concurrent("visCanvasUtils", () => {
  describe("isEdge", () => {
    it("returns true for link and association, false for node types", ({
      expect,
    }) => {
      expect(isEdge("link")).toBe(true);
      expect(isEdge("association")).toBe(true);
      expect(isEdge("host")).toBe(false);
      expect(isEdge("switch")).toBe(false);
      expect(isEdge("controller")).toBe(false);
      expect(isEdge("port")).toBe(false);
      expect(isEdge("dummy")).toBe(false);
    });
  });

  describe("buildGroupColor", () => {
    it("returns color object with transparent background when bg is false", ({
      expect,
    }) => {
      const canvasColor = "#ff0000";
      const result = buildGroupColor({ canvas: canvasColor }, false, "#ffffff");

      expect(result).toEqual({
        background: "transparent",
        border: canvasColor,
        highlight: { background: "transparent", border: canvasColor },
        hover: { background: "transparent", border: canvasColor },
      });
    });

    it("returns color object with theme background when bg is true", ({
      expect,
    }) => {
      const canvasColor = "#00ff00";
      const themeBackground = "#1e1e1e";
      const result = buildGroupColor(
        { canvas: canvasColor },
        true,
        themeBackground,
      );

      expect(result).toEqual({
        background: themeBackground,
        border: canvasColor,
        highlight: { background: themeBackground, border: canvasColor },
        hover: { background: themeBackground, border: canvasColor },
      });
    });
  });

  describe("itemToNode", () => {
    it("returns node with hostname as label for non-dummy types", ({
      expect,
    }) => {
      const item = {
        id: "s1",
        type: "switch",
        hostname: "s1",
        x: 10,
        y: 20,
      };
      const result = itemToNode(item, () => "should-not-be-called");

      expect(result.id).toBe("s1");
      expect(result.group).toBe("switch");
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
      expect(result.label).toBe("s1");
      expect(result.title).toBeDefined();
    });

    it("returns node with processed label for dummy type", ({ expect }) => {
      const item = {
        id: "d1",
        type: "dummy",
        hostname: "raw-label",
        x: 5,
        y: 15,
      };
      const result = itemToNode(item, processLabelFn);

      expect(result.id).toBe("d1");
      expect(result.group).toBe("dummy");
      expect(result.label).toBe("processed-label");
    });
  });

  describe("itemToEdge", () => {
    it("returns edge object with from, to, label and title", ({ expect }) => {
      const item = {
        id: "e1",
        type: "link",
        from: "s1",
        to: "h1",
        hostname: "link-1",
      };
      const result = itemToEdge(item);

      expect(result.id).toBe("e1");
      expect(result.from).toBe("s1");
      expect(result.to).toBe("h1");
      expect(result.label).toBe("link-1");
      expect(result.title).toBeDefined();
    });
  });

  describe("processLabel", () => {
    it("returns hostname when net is null", ({ expect }) => {
      const item = { id: "d1", hostname: "test-label" };
      const result = processLabel(item, null, {});

      expect(result).toBe("test-label");
    });

    it("replaces placeholders using neighbor data from net", ({ expect }) => {
      const item = {
        id: "d1",
        type: "dummy",
        hostname: "{{HOSTNAMES}}",
      };
      const dataItems = {
        s1: {
          id: "s1",
          type: "switch",
          hostname: "s1",
        },
      };
      const net = {
        getConnectedNodes: (id) => (id === "d1" ? ["s1"] : []),
      };

      const result = processLabel(item, net, dataItems);

      expect(result).toBe("s1");
    });

    it("returns hostname unchanged when no placeholders present", ({
      expect,
    }) => {
      const item = { id: "d1", hostname: "plain-label" };
      const net = {
        getConnectedNodes: () => [],
      };

      const result = processLabel(item, net, {});

      expect(result).toBe("plain-label");
    });
  });
});
