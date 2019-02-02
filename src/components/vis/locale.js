const collator = new Intl.Collator(undefined, { numeric: true })
const compare = collator.compare
const compareNodes = (a, b) => compare(a.label, b.label)
const compareItems = (a, b) => compare(a.label, b.label)

export {
  collator,
  compare,
  compareNodes,
  compareItems
}
