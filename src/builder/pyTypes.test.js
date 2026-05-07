import { describe, it } from "vitest";
import { pyTypes } from "@/builder/pyTypes.js";

describe.concurrent("pyTypes", () => {
  describe("pyBoolean (via pyTypes.get(Boolean))", () => {
    const pyBoolean = pyTypes.get(Boolean);

    it.for([
      ["true", true, "True"],
      ["false", false, "False"],
    ])(
      "converts %s to Python representation",
      ([_label, input, expected], { expect }) => {
        expect(pyBoolean(input)).toBe(expected);
      },
    );
  });

  describe("pyNumber (via pyTypes.get(Number))", () => {
    const pyNumber = pyTypes.get(Number);

    it.for([
      ["integer", 42, "42"],
      ["zero", 0, "0"],
      ["negative", -7, "-7"],
      ["float", 3.14, "3.14"],
    ])(
      "converts %s to string representation",
      ([_label, input, expected], { expect }) => {
        expect(pyNumber(input)).toBe(expected);
      },
    );
  });

  describe("pyString (via pyTypes.get(String))", () => {
    const pyString = pyTypes.get(String);

    it.for([
      ["simple string", "hello", "'hello'"],
      ["empty string", "", "''"],
      ["string with single quote", "it's", "'it\\'s'"],
      ["string with special characters", "a&b<c>d", "'a&b<c>d'"],
    ])(
      "wraps %s in single quotes with escaping",
      ([_label, input, expected], { expect }) => {
        expect(pyString(input)).toBe(expected);
      },
    );
  });

  describe("pyRaw (via pyTypes.get(null))", () => {
    const pyRaw = pyTypes.get(null);

    it.for([
      ["simple string", "raw_value", "raw_value"],
      ["empty string", "", ""],
      ["numeric string", "42", "42"],
    ])(
      "returns %s as-is without wrapping",
      ([_label, input, expected], { expect }) => {
        expect(pyRaw(input)).toBe(expected);
      },
    );
  });

  describe("Map structure", () => {
    it("contains exactly four entries mapping constructors to converters", ({
      expect,
    }) => {
      expect(pyTypes.size).toBe(4);
      expect(pyTypes.has(Boolean)).toBe(true);
      expect(pyTypes.has(Number)).toBe(true);
      expect(pyTypes.has(String)).toBe(true);
      expect(pyTypes.has(null)).toBe(true);
    });

    it("returns functions for all keys", ({ expect }) => {
      expect(typeof pyTypes.get(Boolean)).toBe("function");
      expect(typeof pyTypes.get(Number)).toBe("function");
      expect(typeof pyTypes.get(String)).toBe("function");
      expect(typeof pyTypes.get(null)).toBe("function");
    });
  });
});
