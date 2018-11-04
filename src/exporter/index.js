export default {
  importData ({ version, script, items }) {
    switch (version) {
      case 0:
        return {
          script,
          items: items.reduce((acc, val) => {
            acc[val.id] = val
            return acc
          }, {})
        }
      default:
        throw new TypeError('Unsuported export version.')
    }
  },
  exportData ({ version, script, items }) {
    return {
      version: 0,
      script,
      items: Object.values(items)
    }
  }
}
