export default {
  importData (external) {
    const { version, script, items } = JSON.parse(JSON.stringify(external))
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
  exportData (internal) {
    const { script, items } = JSON.parse(JSON.stringify(internal))
    return {
      version: 0,
      script,
      items: Object.values(items)
    }
  }
}
