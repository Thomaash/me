import { describe, it, expect, vi } from "vitest";

const matchMediaMock = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: matchMediaMock,
});

const {
  vuetifyLight,
  vuetifyDark,
  itemsLight,
  itemsDark,
  selectionLight,
  selectionDark,
  canvasLight,
  canvasDark,
  dark,
  vuetify,
  items,
  selection,
  canvas,
} = await import("@/theme.js");

const vuetifyColorKeys = [
  "primary",
  "secondary",
  "accent",
  "error",
  "warning",
  "info",
  "success",
];

const itemKeys = ["controller", "dummy", "edge", "host", "port", "switch"];

describe("matchMedia integration", () => {
  it("queries the correct prefers-color-scheme media string", ({ expect }) => {
    expect(matchMediaMock).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });
});

describe("addAlpha with short hex format", () => {
  it("correctly parses 4-char hex (#RGB) into individual color channels", async ({ expect }) => {
    vi.resetModules();

    vi.doMock("@/theme-colors.js", () => ({
      themeColors: {
        teal: { base: "#09A", lighten1: "#09A" },
        amber: { darken1: "#09A" },
        red: { base: "#09A" },
        orange: { base: "#09A" },
        blue: { base: "#09A" },
        green: { base: "#09A" },
        purple: { base: "#09A" },
        grey: { darken4: "#09A", darken3: "#09A", base: "#09A" },
        cyan: { base: "#09A" },
        indigo: { base: "#09A" },
        shades: { black: "#000", white: "#FFF" },
      },
    }));

    const mod = await import("@/theme.js");

    // With 4-char hex #09A, addAlpha parses single chars: "0"=0, "9"=9, "A"=10 (base 12)
    // Result: "rgba(0, 9, 10, <alpha>)"
    expect(mod.selectionLight.background).toBe("rgba(0, 9, 10, 0.25)");
    expect(mod.selectionLight.border).toBe("rgba(0, 9, 10, 0.75)");

    vi.doUnmock("@/theme-colors.js");
  });
});

describe("theme exports", () => {
  describe("vuetify theme objects", () => {
    it.each([
      ["vuetifyLight", vuetifyLight, false],
      ["vuetifyDark", vuetifyDark, true],
    ])(
      "%s has dark=%s and colors with all required keys",
      (_name, theme, expectedDark) => {
        expect(theme.dark).toBe(expectedDark);
        expect(Object.keys(theme.colors)).toEqual(
          expect.arrayContaining(vuetifyColorKeys),
        );
        for (const key of vuetifyColorKeys) {
          expect(theme.colors[key]).toEqual(expect.any(String));
        }
      },
    );
  });

  describe("items theme objects", () => {
    it.each([
      ["itemsLight", itemsLight],
      ["itemsDark", itemsDark],
    ])(
      "%s contains all item types with menu and canvas color values",
      (_name, items) => {
        expect(Object.keys(items)).toEqual(expect.arrayContaining(itemKeys));
        for (const key of itemKeys) {
          expect(items[key]).toEqual({
            menu: expect.any(String),
            canvas: expect.any(String),
          });
        }
      },
    );
  });

  describe("selection theme objects (addAlpha indirect verification)", () => {
    it.each([
      ["selectionLight", selectionLight],
      ["selectionDark", selectionDark],
    ])(
      "%s contains background and border as rgba strings with alpha values",
      (_name, sel) => {
        expect(sel.background).toBe("rgba(0, 114, 104, 0.25)");
        expect(sel.border).toBe("rgba(0, 114, 104, 0.75)");
      },
    );
  });

  describe("canvas theme objects", () => {
    it("canvasLight has foreground and background keys with color values", ({ expect }) => {
      expect(canvasLight).toEqual({
        foreground: expect.any(String),
        background: expect.any(String),
      });
      expect(canvasLight.foreground).toBe("#000000");
      expect(canvasLight.background).toBe("#ffffff");
    });

    it("canvasDark has foreground and background keys with color values", ({ expect }) => {
      expect(canvasDark).toEqual({
        foreground: expect.any(String),
        background: expect.any(String),
      });
      expect(canvasDark.foreground).toBe("#ffffff");
      expect(canvasDark.background).toBe("#424242");
    });
  });

  describe("re-exported constants select light variants when prefers-color-scheme is light", () => {
    it("dark is false and vuetify, items, selection, canvas equal their light variants", ({ expect }) => {
      expect(dark).toBe(false);
      expect(vuetify).toBe(vuetifyLight);
      expect(items).toBe(itemsLight);
      expect(selection).toBe(selectionLight);
      expect(canvas).toBe(canvasLight);
    });
  });
});

describe("dark mode branch paths", () => {
  it("exports dark variant values when prefers-color-scheme is dark", async ({ expect }) => {
    vi.resetModules();

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    const mod = await import("@/theme.js");

    expect(mod.dark).toBe(true);
    expect(mod.vuetify).toBe(mod.vuetifyDark);
    expect(mod.items).toBe(mod.itemsDark);
    expect(mod.selection).toBe(mod.selectionDark);
    expect(mod.canvas).toBe(mod.canvasDark);

    vi.unstubAllGlobals();
  });
});
