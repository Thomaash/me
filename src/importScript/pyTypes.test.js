import { describe, it, expect } from "vitest";
import {
  pyBoolean,
  pyNotNull,
  pyNumber,
  pyString,
} from "@/importScript/pyTypes.js";

describe.concurrent("importScript/pyTypes", () => {
  describe("pyBoolean", () => {
    it.each([
      ["True", true],
      ["False", false],
    ])("returns %s parsed as %s", (input, expected) => {
      expect(pyBoolean(input)).toBe(expected);
    });

    it.each(["true", "false", "yes", "no", "1", "0", ""])(
      'throws TypeError for invalid input "%s"',
      (input) => {
        expect(() => pyBoolean(input)).toThrow(TypeError);
      },
    );
  });

  describe("pyNotNull", () => {
    it.each(["hello", "some value", "0", "false", "True", "False"])(
      'returns truthy for non-null non-"None" string "%s"',
      (input) => {
        expect(pyNotNull(input)).toBeTruthy();
      },
    );

    it.each([
      ["null", null],
      ["undefined", undefined],
      ["empty string", ""],
      ["None", "None"],
    ])("returns falsy for %s", (_label, input) => {
      expect(pyNotNull(input)).toBeFalsy();
    });

    it("returns falsy specifically for the string 'None' (not other similar strings)", ({
      expect,
    }) => {
      expect(pyNotNull("None")).toBeFalsy();
      expect(pyNotNull("none")).toBeTruthy();
      expect(pyNotNull("NONE")).toBeTruthy();
      expect(pyNotNull("None ")).toBeTruthy();
    });
  });

  describe("pyNumber", () => {
    it.each([
      ["42", 42],
      ["0", 0],
      ["-7", -7],
      ["3.14", 3.14],
      ["1", 1],
      ["100", 100],
    ])('converts numeric string "%s" to %d', (input, expected) => {
      expect(pyNumber(input)).toBe(expected);
    });

    it("returns exact numeric value (not 0 or negated)", ({ expect }) => {
      expect(pyNumber("5")).toBe(5);
      expect(pyNumber("5")).not.toBe(0);
      expect(pyNumber("5")).not.toBe(-5);
    });

    it.each(["abc", "twelve", "10px"])(
      'throws TypeError for non-numeric string "%s"',
      (input) => {
        expect(() => pyNumber(input)).toThrow(TypeError);
      },
    );

    it("returns typeof number", ({ expect }) => {
      expect(typeof pyNumber("42")).toBe("number");
    });
  });

  describe("pyString", () => {
    it.each([
      ["'hello'", "hello"],
      ["'world'", "world"],
      ["''", ""],
      ["'it\\'s'", "it\\'s"],
      ["'a'", "a"],
      ["'ab'", "ab"],
    ])("strips surrounding quotes from %s", (input, expected) => {
      expect(pyString(input)).toBe(expected);
    });

    it("strips exactly the first and last quote characters", ({ expect }) => {
      const result = pyString("'test'");
      expect(result).toBe("test");
      expect(result.length).toBe(4);
      expect(result).not.toContain("'");
    });

    it("preserves exact content between quotes (no extra chars stripped)", ({
      expect,
    }) => {
      expect(pyString("'abc'")).toBe("abc");
      expect(pyString("'abc'").length).toBe(3);
      // If substr(1,...) offset was 0 instead of 1, we'd get "'abc" or "'ab"
      expect(pyString("'abc'")[0]).toBe("a");
    });

    it.each(["hello", '"hello"', "no quotes", ""])(
      'throws TypeError for non-quoted string "%s"',
      (input) => {
        expect(() => pyString(input)).toThrow(TypeError);
      },
    );

    it("rejects strings with only opening quote", ({ expect }) => {
      expect(() => pyString("'hello")).toThrow(TypeError);
    });

    it("rejects strings with only closing quote", ({ expect }) => {
      expect(() => pyString("hello'")).toThrow(TypeError);
    });
  });
});
