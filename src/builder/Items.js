const edgeRE = /^(link|association)$/;
const collator = new Intl.Collator("en-US-u-kn");

export default class {
  constructor(itemsArray) {
    // Maps
    this.map = {
      $all: Object.create(null),
      $edges: Object.create(null),
      $nodes: Object.create(null),
      association: Object.create(null),
      controller: Object.create(null),
      host: Object.create(null),
      link: Object.create(null),
      port: Object.create(null),
      switch: Object.create(null),
    };
    itemsArray
      .map(
        // Add new attrs without modifying original data.
        (item) => Object.create(item)
      )
      .forEach((item) => {
        const { id, type } = item;

        this.map.$all[id] = item;
        if (edgeRE.test(type)) {
          this.map.$edges[id] = item;
        } else {
          item.$associations = [];
          item.$edges = [];
          item.$links = [];
          this.map.$nodes[id] = item;
        }

        const obj = this.map[type] || (this.map[type] = Object.create(null));
        obj[id] = item;
      });

    // Arrays
    this.arr = {};
    Object.keys(this.map).forEach((key) => {
      this.arr[key] = Object.values(this.map[key]).sort(
        ({ hostname: a }, { hostname: b }) => collator.compare(a, b)
      );
    });

    // Node's edges and edge's nodes
    this.arr.$edges.forEach((edge) => {
      const nodes = [this.map.$nodes[edge.from], this.map.$nodes[edge.to]];

      ["$edges", `$${edge.type}s`].forEach((key) => {
        nodes.forEach((node) => {
          node[key].push(edge);
        });
      });
      edge.$nodes = nodes;
    });
  }
}
