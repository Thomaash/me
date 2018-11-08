import generateTooltip from './generateTooltip'

export default function (node, item) {
  node.label = item.hostname
  node.title = generateTooltip(item)

  return node
}
