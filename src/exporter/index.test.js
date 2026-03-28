import { describe, it, expect } from "vitest";
import exporter from "@/exporter/index.js";

const { importData, exportData } = exporter;

describe.concurrent("exporter", () => {
  describe("importData", () => {
    it("converts version 0 external format to internal format, removing version and keying items by id", ({ expect }) => {
      const external = {
        version: 0,
        name: "my-project",
        settings: { theme: "dark" },
        items: [
          { id: "a1", label: "Alpha", value: 10 },
          { id: "b2", label: "Beta", value: 20 },
        ],
      };

      const result = importData(external);

      expect(result).toEqual({
        name: "my-project",
        settings: { theme: "dark" },
        items: {
          a1: { id: "a1", label: "Alpha", value: 10 },
          b2: { id: "b2", label: "Beta", value: 20 },
        },
      });
      expect(result).not.toHaveProperty("version");
    });

    it("deep-clones input data and does not mutate the original", ({ expect }) => {
      const external = {
        version: 0,
        items: [{ id: "x", nested: { deep: true } }],
      };
      const originalSnapshot = JSON.parse(JSON.stringify(external));

      const result = importData(external);

      expect(external).toEqual(originalSnapshot);
      result.items.x.nested.deep = false;
      expect(external.items[0].nested.deep).toBe(true);
    });

    it.each([
      ["version 1", { version: 1, items: [] }],
      ["version 99", { version: 99, items: [] }],
      ["undefined version", { items: [] }],
      ["null version", { version: null, items: [] }],
      ["string version", { version: "0", items: [] }],
    ])(
      "throws TypeError for unsupported version: %s",
      (_label, external) => {
        expect(() => importData(external)).toThrow(TypeError);
      },
    );

    it("throws with specific error message for unsupported version", ({ expect }) => {
      expect(() => importData({ version: 1, items: [] })).toThrow(
        "Unsupported export version.",
      );
    });
  });

  describe("exportData", () => {
    it("converts internal format to version 0 external format with items as array and version property", ({ expect }) => {
      const internal = {
        name: "my-project",
        settings: { theme: "dark" },
        items: {
          a1: { id: "a1", label: "Alpha", value: 10 },
          b2: { id: "b2", label: "Beta", value: 20 },
        },
      };

      const result = exportData(internal);

      expect(result).toEqual({
        name: "my-project",
        settings: { theme: "dark" },
        version: 0,
        items: [
          { id: "a1", label: "Alpha", value: 10 },
          { id: "b2", label: "Beta", value: 20 },
        ],
      });
      expect(result.version).toBe(0);
    });

    it("deep-clones input data and does not mutate the original", ({ expect }) => {
      const internal = {
        items: {
          x: { id: "x", nested: { deep: true } },
        },
      };
      const originalSnapshot = JSON.parse(JSON.stringify(internal));

      const result = exportData(internal);

      expect(internal).toEqual(originalSnapshot);
      result.items[0].nested.deep = false;
      expect(internal.items.x.nested.deep).toBe(true);
    });
  });

  describe("round-trip", () => {
    it("exportData(importData(data)) produces structure equivalent to original data", ({ expect }) => {
      const original = {
        version: 0,
        name: "round-trip-test",
        metadata: { created: "2026-01-01" },
        items: [
          { id: "r1", type: "widget", count: 5 },
          { id: "r2", type: "gadget", count: 3 },
        ],
      };

      const roundTripped = exportData(importData(original));

      expect(roundTripped).toEqual(original);
    });
  });
});
