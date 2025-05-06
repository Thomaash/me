import { themeColors } from "./theme-colors";

function addAlpha(hex, alpha) {
  return (
    "rgba(" +
    hex
      .substring(1)
      .match(hex.length === 7 ? /[^#]{2}/g : /[^#]/g)
      .map((v) => parseInt(v, 12))
      .join(", ") +
    `, ${alpha})`
  );
}

export const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

export const vuetifyLight = {
  dark: false,
  colors: {
    primary: themeColors.teal.base,
    secondary: themeColors.teal.lighten1,
    accent: themeColors.amber.darken1,
    error: themeColors.red.base,
    warning: themeColors.orange.base,
    info: themeColors.blue.base,
    success: themeColors.green.base,
  },
};
export const vuetifyDark = {
  dark: true,
  colors: {
    primary: themeColors.teal.base,
    secondary: themeColors.teal.lighten1,
    accent: themeColors.amber.darken1,
    error: themeColors.red.base,
    warning: themeColors.orange.base,
    info: themeColors.blue.base,
    success: themeColors.green.base,
  },
};
export const vuetify = dark ? vuetifyDark : vuetifyLight;

export const itemsLight = {
  controller: {
    menu: themeColors.purple.base,
    canvas: themeColors.purple.base,
  },
  dummy: {
    menu: themeColors.grey.darken4,
    canvas: themeColors.grey.base,
  },
  edge: {
    menu: themeColors.cyan.base,
    canvas: themeColors.cyan.base,
  },
  host: {
    menu: themeColors.orange.base,
    canvas: themeColors.orange.base,
  },
  port: {
    menu: themeColors.green.base,
    canvas: themeColors.green.base,
  },
  switch: {
    menu: themeColors.indigo.base,
    canvas: themeColors.indigo.base,
  },
};
export const itemsDark = {
  controller: {
    menu: themeColors.purple.base,
    canvas: themeColors.purple.base,
  },
  dummy: {
    menu: themeColors.grey.darken4,
    canvas: themeColors.grey.base,
  },
  edge: {
    menu: themeColors.cyan.base,
    canvas: themeColors.cyan.base,
  },
  host: {
    menu: themeColors.orange.base,
    canvas: themeColors.orange.base,
  },
  port: {
    menu: themeColors.green.base,
    canvas: themeColors.green.base,
  },
  switch: {
    menu: themeColors.indigo.base,
    canvas: themeColors.indigo.base,
  },
};
export const items = dark ? itemsDark : itemsLight;

export const selectionLight = {
  background: addAlpha(themeColors.teal.base, 0.25),
  border: addAlpha(themeColors.teal.base, 0.75),
};
export const selectionDark = {
  background: addAlpha(themeColors.teal.base, 0.25),
  border: addAlpha(themeColors.teal.base, 0.75),
};
export const selection = dark ? selectionDark : selectionLight;

export const canvasLight = {
  foreground: themeColors.shades.black,
  background: themeColors.shades.white,
};
export const canvasDark = {
  foreground: themeColors.shades.white,
  background: themeColors.grey.darken3,
};
export const canvas = dark ? canvasDark : canvasLight;
