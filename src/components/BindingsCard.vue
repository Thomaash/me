<template>
  <v-card>
    <v-card-title primary-title>
      <h3>Bindings</h3>
    </v-card-title>
    <v-card-text>
      <v-data-table :headers="headers" :items="items" hide-actions hide-headers>
        <template slot="items" slot-scope="props">
          <td v-html="props.item.combination">
          <td v-text="props.item.description"/>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
function wrapTitle (title, html) {
  return `<span class="with-title" title="${title}">${html}</span>`
}

const keys = {
  ctrl: wrapTitle('Control', '<kbd>Ctrl</kbd>'),
  del: wrapTitle('Delete', '<kbd>Del</kbd>'),
  esc: wrapTitle('Escape', '<kbd>Esc</kbd>'),

  lmb: wrapTitle('Left mouse button', '<kbd>LMB</kbd>'),
  lmbdc: wrapTitle('Double click left mouse button', '<kbd>LMB</kbd>, <kbd>LMB</kbd>'),
  lmblp: wrapTitle('Long press left mouse button', '<kbd>   LMB   </kbd>')
}

export default {
  name: 'Home',
  data: () => ({
    headers: [
      { text: 'Combination', value: 'name', sortable: false },
      { text: 'Description', value: 'description', sortable: false }
    ],
    items: [
      { combination: `${keys.ctrl} + ${keys.lmb}`, description: 'Select or unselect multiple items.' },
      { combination: `${keys.lmbdc}`, description: 'Edit item.' },
      { combination: `${keys.lmblp}`, description: 'Organise the ports of a switch or host.' },
      { combination: `${keys.lmblp}`, description: 'Reconnect a link or association.' },
      { combination: `${keys.lmb}`, description: 'Place a new port nearby a switch or host to automatically connect them.' },

      { combination: `${keys.del}`, description: 'Delete selected items.' },
      { combination: `${keys.esc}`, description: 'Stop editing edges or adding items.' },

      { combination: '<kbd>A</kbd>', description: 'Fit all items into the viewport.' },
      { combination: '<kbd>C</kbd>', description: 'Add a controller.' },
      { combination: '<kbd>D</kbd>', description: 'Delete selected items.' },
      { combination: '<kbd>E</kbd>', description: 'Add an edge.' },
      { combination: '<kbd>F</kbd>', description: 'Fit selected items into the viewport.' },
      { combination: '<kbd>H</kbd>', description: 'Add a host.' },
      { combination: '<kbd>L</kbd>', description: 'Add a label.' },
      { combination: '<kbd>P</kbd>', description: 'Add a port.' },
      { combination: '<kbd>S</kbd>', description: 'Add a switch.' },
      { combination: '<kbd>Z</kbd>', description: 'Reset zoom.' }
    ]
  })
}
</script>

<style scoped>
</style>
