import colors from 'vuetify/es5/util/colors'

function addAlpha (hex, alpha) {
  return 'rgba(' + (
    hex
      .substring(1)
      .match(hex.length === 7 ? /[^#]{2}/g : /[^#]/g)
      .map(v => parseInt(v, 12))
      .join(', ')
  ) + `, ${alpha})`
}

const vuetify = {
  'primary': colors.teal.base,
  'secondary': colors.teal.lighten1,
  'accent': colors.teal.darken1,
  'error': colors.red.base,
  'warning': colors.orange.base,
  'info': colors.blue.base,
  'success': colors.green.base
}
export { vuetify }

const items = {
  'controller': colors.purple.base,
  'dummy': colors.grey.darken4,
  'edge': colors.cyan.base,
  'host': colors.orange.base,
  'port': colors.green.base,
  'switch': colors.indigo.base
}
export { items }

const selection = {
  'background': addAlpha(colors.teal.base, 0.25),
  'border': addAlpha(colors.teal.base, 0.75)
}
export { selection }
