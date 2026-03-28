import { describe, it, expect } from "vitest";
import pyArgs from "@/builder/pyArgs.js";

describe.concurrent("pyArgs", () => {
  describe("pyArgPre with 1 arg (value only)", () => {
    it("returns the raw value string", ({ expect }) => {
      const result = pyArgs([["some_value"]]);
      expect(result).toEqual(["some_value"]);
    });
  });

  describe("pyArgPre with 2 args (value, type)", () => {
    it.each([
      ["Boolean true", true, Boolean, "True"],
      ["Boolean false", false, Boolean, "False"],
      ["Number", 42, Number, "42"],
      ["String", "hello", String, "'hello'"],
    ])("applies the type converter for %s", (_label, value, type, expected) => {
      const result = pyArgs([[value, type]]);
      expect(result).toEqual([expected]);
    });
  });

  describe("pyArgPre with 3 args (value, type, name) where name is a string", () => {
    it.each([
      ["Boolean", true, Boolean, "flag", "flag=True"],
      ["Number", 100, Number, "count", "count=100"],
      ["String", "world", String, "greeting", "greeting='world'"],
    ])(
      "returns name=convertedValue for %s type",
      (_label, value, type, name, expected) => {
        const result = pyArgs([[value, type, name]]);
        expect(result).toEqual([expected]);
      },
    );
  });

  describe("pyArgPre with 3 args (test, value, type) where third arg is not a string", () => {
    it("returns converted value when test is truthy", ({ expect }) => {
      const result = pyArgs([[true, 42, Number]]);
      expect(result).toEqual(["42"]);
    });

    it("returns empty array when test is falsy (null filtered out)", ({
      expect,
    }) => {
      const result = pyArgs([[false, 42, Number]]);
      expect(result).toEqual([]);
    });
  });

  describe("pyArgPre with 4 args (test, value, type, name)", () => {
    it("returns name=convertedValue when test is truthy", ({ expect }) => {
      const result = pyArgs([[true, "hello", String, "msg"]]);
      expect(result).toEqual(["msg='hello'"]);
    });

    it("returns empty array when test is falsy (null filtered out)", ({
      expect,
    }) => {
      const result = pyArgs([[false, "hello", String, "msg"]]);
      expect(result).toEqual([]);
    });
  });

  describe("pyArgPre argument count validation", () => {
    it.each([
      ["0 arguments", []],
      ["5 arguments", [1, 2, 3, 4, 5]],
      ["6 arguments", [1, 2, 3, 4, 5, 6]],
    ])("throws TypeError for %s", (_label, args) => {
      expect(() => pyArgs([args])).toThrow(TypeError);
    });

    it("throws TypeError with message containing the actual argument count", ({
      expect,
    }) => {
      expect(() => pyArgs([[]])).toThrow(/0/);
      expect(() => pyArgs([[1, 2, 3, 4, 5]])).toThrow(/5/);
    });
  });

  describe("array filtering", () => {
    it("filters out null entries from the results array", ({ expect }) => {
      const result = pyArgs([
        [true, 1, Number],
        [false, 2, Number],
        [true, 3, Number],
        [false, 4, Number],
      ]);
      expect(result).toEqual(["1", "3"]);
    });

    it("returns only truthy results with mixed truthy/falsy test values", ({
      expect,
    }) => {
      const result = pyArgs([
        ["visible"],
        [true, "active", Boolean, "is_active"],
        [false, "skip_me", String, "label"],
        [100, Number],
        [true, 0, Boolean, "flag"],
      ]);
      expect(result).toEqual([
        "visible",
        "is_active=True",
        "100",
        "flag=False",
      ]);
    });
  });
});
