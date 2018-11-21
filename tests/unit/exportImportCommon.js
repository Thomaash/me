function getCleanItems (items, typeOnly) {
  return items.filter(node =>
    !typeOnly ||
    node.type === typeOnly
  ).map(orig => {
    const type = orig.type
    const isEdge = type === 'link' || type === 'association'

    const clean = {}
    Object.keys(orig).forEach(key => {
      if (type === 'port' && key === 'ips') {
        clean[key] = orig[key].sort()
      } else if (key === 'startScript' || key === 'stopScript') {
        clean[key] = orig[key]
          .split('\n')
          .filter(line => !/^(\s*#|$)/.test(line))
          .join('\n')
      } else if (
        (isEdge && !/^(id|hostname|from|to)$/.test(key)) ||
        (!isEdge && !/^(id|x|y)$/.test(key))
      ) {
        clean[key] = orig[key]
      }
    })
    return clean
  })
}
export { getCleanItems }

function removeNonCode (script) {
  return script.split('\n')
    .filter(line => !/^($|#)/.test(line))
    .join('\n')
}
export { removeNonCode }

const types = {
  autoSetMAC: 'boolean',
  autoStaticARP: 'boolean',
  inNamespace: 'boolean',
  ipBase: 'string',
  items: 'array',
  listenPortBase: 'number',
  logLevel: 'string',
  spawnTerminals: 'boolean',
  startScript: 'string',
  stopScript: 'string',
  version: 'number'
}
export { types }
