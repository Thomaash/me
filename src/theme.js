import colors from "vuetify/es5/util/colors";

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
  primary: colors.teal.base,
  secondary: colors.teal.lighten1,
  accent: colors.amber.darken1,
  error: colors.red.base,
  warning: colors.orange.base,
  info: colors.blue.base,
  success: colors.green.base,
};
export const vuetifyDark = {
  primary: colors.teal.base,
  secondary: colors.teal.lighten1,
  accent: colors.amber.darken1,
  error: colors.red.base,
  warning: colors.orange.base,
  info: colors.blue.base,
  success: colors.green.base,
};
export const vuetify = dark ? vuetifyDark : vuetifyLight;

export const itemsLight = {
  controller: {
    menu: colors.purple.base,
    canvas: colors.purple.base,
  },
  dummy: {
    menu: colors.grey.darken4,
    canvas: colors.grey.base,
  },
  edge: {
    menu: colors.cyan.base,
    canvas: colors.cyan.base,
  },
  host: {
    menu: colors.orange.base,
    canvas: colors.orange.base,
  },
  port: {
    menu: colors.green.base,
    canvas: colors.green.base,
  },
  switch: {
    menu: colors.indigo.base,
    canvas: colors.indigo.base,
  },
};
export const itemsDark = {
  controller: {
    menu: colors.purple.base,
    canvas: colors.purple.base,
  },
  dummy: {
    menu: colors.grey.darken4,
    canvas: colors.grey.base,
  },
  edge: {
    menu: colors.cyan.base,
    canvas: colors.cyan.base,
  },
  host: {
    menu: colors.orange.base,
    canvas: colors.orange.base,
  },
  port: {
    menu: colors.green.base,
    canvas: colors.green.base,
  },
  switch: {
    menu: colors.indigo.base,
    canvas: colors.indigo.base,
  },
};
export const items = dark ? itemsDark : itemsLight;

export const selectionLight = {
  background: addAlpha(colors.teal.base, 0.25),
  border: addAlpha(colors.teal.base, 0.75),
};
export const selectionDark = {
  background: addAlpha(colors.teal.base, 0.25),
  border: addAlpha(colors.teal.base, 0.75),
};
export const selection = dark ? selectionDark : selectionLight;

export const canvasLight = {
  foreground: colors.shades.black,
  background: colors.shades.white,
};
export const canvasDark = {
  foreground: colors.shades.white,
  background: colors.grey.darken3,
};
export const canvas = dark ? canvasDark : canvasLight;
