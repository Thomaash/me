function getCleanItems (items, type) {
  return items.filter(node =>
    !type ||
    node.type === type
  ).map(orig => {
    const clean = {}
    Object.keys(orig).forEach(key => {
      if (type === 'port' && key === 'ips') {
        clean[key] = orig[key].sort()
      } else if (
        (type === 'link' && !/^(id|hostname|from|to)$/.test(key)) ||
        (type !== 'link' && !/^(id|x|y)$/.test(key))
      ) {
        clean[key] = orig[key]
      }
    })
    return clean
  })
}
export { getCleanItems }
