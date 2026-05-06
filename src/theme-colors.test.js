import { describe, it } from "vitest";

import {
  themeColorRed,
  themeColorPink,
  themeColorPurple,
  themeColorDeepPurple,
  themeColorIndigo,
  themeColorBlue,
  themeColorLightBlue,
  themeColorCyan,
  themeColorTeal,
  themeColorGreen,
  themeColorLightGreen,
  themeColorLime,
  themeColorYellow,
  themeColorAmber,
  themeColorOrange,
  themeColorDeepOrange,
  themeColorBrown,
  themeColorBlueGrey,
  themeColorGrey,
  themeColorShades,
  themeColors,
} from "@/theme-colors.js";

const standardKeys = [
  "base",
  "lighten5",
  "lighten4",
  "lighten3",
  "lighten2",
  "lighten1",
  "darken1",
  "darken2",
  "darken3",
  "darken4",
  "accent1",
  "accent2",
  "accent3",
  "accent4",
];

const noAccentKeys = [
  "base",
  "lighten5",
  "lighten4",
  "lighten3",
  "lighten2",
  "lighten1",
  "darken1",
  "darken2",
  "darken3",
  "darken4",
];

const shadesKeys = ["black", "white", "transparent"];

const standardColors = [
  ["themeColorRed", themeColorRed],
  ["themeColorPink", themeColorPink],
  ["themeColorPurple", themeColorPurple],
  ["themeColorDeepPurple", themeColorDeepPurple],
  ["themeColorIndigo", themeColorIndigo],
  ["themeColorBlue", themeColorBlue],
  ["themeColorLightBlue", themeColorLightBlue],
  ["themeColorCyan", themeColorCyan],
  ["themeColorTeal", themeColorTeal],
  ["themeColorGreen", themeColorGreen],
  ["themeColorLightGreen", themeColorLightGreen],
  ["themeColorLime", themeColorLime],
  ["themeColorYellow", themeColorYellow],
  ["themeColorAmber", themeColorAmber],
  ["themeColorOrange", themeColorOrange],
  ["themeColorDeepOrange", themeColorDeepOrange],
];

const noAccentColors = [
  ["themeColorBrown", themeColorBrown],
  ["themeColorBlueGrey", themeColorBlueGrey],
  ["themeColorGrey", themeColorGrey],
];

const allColors = [
  ...standardColors,
  ...noAccentColors,
  ["themeColorShades", themeColorShades],
];

describe.concurrent("theme-colors exports and immutability", () => {
  describe("standard color objects (with accents)", () => {
    it.for(standardColors)(
      "%s has base, lighten1-5, darken1-4, and accent1-4 keys with string values",
      ([_name, colorObj], { expect }) => {
        expect(Object.keys(colorObj).toSorted()).toEqual(
          standardKeys.toSorted(),
        );
        for (const value of Object.values(colorObj)) {
          expect(value).toEqual(expect.any(String));
        }
      },
    );
  });

  describe("color objects without accents", () => {
    it.for(noAccentColors)(
      "%s has base, lighten1-5, and darken1-4 keys (no accents) with string values",
      ([_name, colorObj], { expect }) => {
        expect(Object.keys(colorObj).toSorted()).toEqual(
          noAccentKeys.toSorted(),
        );
        for (const value of Object.values(colorObj)) {
          expect(value).toEqual(expect.any(String));
        }
      },
    );
  });

  it("themeColorShades has black, white, and transparent keys with string values", ({
    expect,
  }) => {
    expect(Object.keys(themeColorShades).toSorted()).toEqual(
      shadesKeys.toSorted(),
    );
    for (const value of Object.values(themeColorShades)) {
      expect(value).toEqual(expect.any(String));
    }
  });

  describe("immutability", () => {
    it.for(allColors)("%s is frozen", ([_name, colorObj], { expect }) => {
      expect(Object.isFrozen(colorObj)).toBe(true);
    });

    it.for(allColors)(
      "%s throws on property mutation and preserves original value",
      ([_name, colorObj], { expect }) => {
        const firstKey = Object.keys(colorObj)[0];
        const originalValue = colorObj[firstKey];
        expect(() => {
          colorObj[firstKey] = "modified";
        }).toThrow(TypeError);
        expect(colorObj[firstKey]).toBe(originalValue);
      },
    );
  });

  describe("master themeColors object", () => {
    it("is frozen", ({ expect }) => {
      expect(Object.isFrozen(themeColors)).toBe(true);
    });

    it("maps 20 color names to their corresponding color objects", ({
      expect,
    }) => {
      const expectedMapping = {
        red: themeColorRed,
        pink: themeColorPink,
        purple: themeColorPurple,
        deepPurple: themeColorDeepPurple,
        indigo: themeColorIndigo,
        blue: themeColorBlue,
        lightBlue: themeColorLightBlue,
        cyan: themeColorCyan,
        teal: themeColorTeal,
        green: themeColorGreen,
        lightGreen: themeColorLightGreen,
        lime: themeColorLime,
        yellow: themeColorYellow,
        amber: themeColorAmber,
        orange: themeColorOrange,
        deepOrange: themeColorDeepOrange,
        brown: themeColorBrown,
        blueGrey: themeColorBlueGrey,
        grey: themeColorGrey,
        shades: themeColorShades,
      };

      expect(Object.keys(themeColors)).toHaveLength(20);
      for (const [name, colorObj] of Object.entries(expectedMapping)) {
        expect(themeColors[name]).toBe(colorObj);
      }
    });
  });
});
