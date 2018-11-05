const edgeRE = /^(link|association)$/

export default class {
  constructor (itemsArray) {
    // Maps
    this.map = {
      $all: Object.create(null),
      $edge: Object.create(null),
      $node: Object.create(null)
    }
    itemsArray.forEach(item => {
      this.map.$all[item.id] = item
      if (edgeRE.test(item.type)) {
        this.map.$edge[item.id] = item
      } else {
        item.$associations = []
        item.$edges = []
        item.$links = []
        this.map.$node[item.id] = item
      }

      const obj = this.map[item.type] || (this.map[item.type] = Object.create(null))
      obj[item.id] = item
    })

    // Arrays
    this.arr = {}
    Object.keys(this.map).forEach(key => {
      this.arr[key] = Object.values(this.map[key])
    })

    // Node's edges and edge's nodes
    this.arr.$edge.forEach(edge => {
      const nodes = [
        this.map.$node[edge.from],
        this.map.$node[edge.to]
      ]

      ;['$edges', `$${edge.type}s`].forEach(key => {
        nodes.forEach(node => {
          node[key].push(edge)
        })
      })
      edge.$nodes = nodes
    })
  }
}
