let last = null;
export default function (net, event) {
  // Don't replace the selection when ctrl is pressed.
  if (event.event.srcEvent.ctrlKey) {
    // Don't react multiple times to the same event.
    const curr = event.event;
    if (last === curr) {
      return;
    }
    last = curr;

    if (
      event.nodes.every(
        (id) => event.previousSelection.nodes.indexOf(id) !== -1
      ) &&
      event.edges.every(
        (id) => event.previousSelection.edges.indexOf(id) !== -1
      )
    ) {
      // Remove from the selection.
      net.setSelection({
        nodes: event.previousSelection.nodes.filter(
          (id) => event.nodes.indexOf(id) === -1
        ),
        edges: event.previousSelection.edges.filter(
          (id) => event.edges.indexOf(id) === -1
        ),
      });
    } else {
      // Add to the selection.
      net.setSelection({
        nodes: [...new Set([...event.nodes, ...event.previousSelection.nodes])],
        edges: [...new Set([...event.edges, ...event.previousSelection.edges])],
      });
    }
  }
}
