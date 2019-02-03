<template>
  <section>
    <h3 class="headline">Bindings</h3>

    <v-data-table :headers="headers" :items="items" hide-actions hide-headers>
      <template slot="items" slot-scope="props">
        <td class="bindings">
          <span v-for="c in parse(props.item.combination)" :is="c.tag" v-text="c.text" :title="c.title" class="with-title"/>
        </td>
        <td v-text="props.item.description"/>
      </template>
    </v-data-table>
  </section>
</template>

<script>
export default {
  name: 'Bindings',
  data: () => ({
    headers: [
      { text: 'Combination', value: 'name', sortable: false },
      { text: 'Description', value: 'description', sortable: false }
    ],
    items: [
      { combination: 'LMB :node', description: 'Place a new node.' },
      { combination: 'LMB :port', description: 'Place a new port (connects to a nearby switch or host).' },
      { combination: 'LMB @ :item', description: 'Select the node or edge.' },
      { combination: 'LMB2 @ :item', description: 'Edit the item.' },
      { combination: 'LMBd :edge', description: 'Connect two nodes with a link or an association.' },
      { combination: 'LMBd @ :node', description: 'Move the node.' },
      { combination: 'LMBd', description: 'Move the viewport.' },
      { combination: 'LMBlp @ :edge', description: 'Reconnect a link or an association.' },
      { combination: 'LMBlp @ :swho', description: 'Organize the ports of a switch or host.' },
      { combination: 'ctrl + LMB @ :item', description: 'Select or unselect multiple items.' },

      { combination: 'RMBd', description: 'Rectangular selection of nodes.' },
      { combination: 'ctrl + RMBd', description: 'Remove nodes from the selection.' },
      { combination: 'shift + RMBd', description: 'Add nodes to the selection.' },

      { combination: 'del', description: 'Delete selected items.' },
      { combination: 'esc', description: 'Stop editing edges or adding items.' },

      { combination: 'a', description: 'Fit all items into the viewport.' },
      { combination: 'c', description: 'Add a controller.' },
      { combination: 'd', description: 'Delete selected items.' },
      { combination: 'e', description: 'Add an edge.' },
      { combination: 'f', description: 'Fit selected items into the viewport.' },
      { combination: 'h', description: 'Add a host.' },
      { combination: 'i', description: 'Add a label witch IPS placeholder (autoconnects to the closest).' },
      { combination: 'l', description: 'Add a label.' },
      { combination: 'p', description: 'Add a port.' },
      { combination: 'r', description: 'Redo undone change.' },
      { combination: 's', description: 'Add a switch.' },
      { combination: 't', description: 'Add a label with TYPES placeholder (autoconnects to the closest).' },
      { combination: 'u', description: 'Undo a change.' },
      { combination: 'z', description: 'Reset zoom.' }
    ],
    special: {
      '@': { tag: 'span', text: ' @ ', title: 'On' },
      '+': { tag: 'span', text: ' + ', title: 'Both together' },

      'LMB': { tag: 'kbd', text: 'LMB', title: 'Left mouse button click' },
      'LMB2': { tag: 'kbd', text: '2·LMB', title: 'Double left mouse button click' },
      'LMBd': { tag: 'kbd', text: 'LMB →', title: 'Drag with left mouse button pressed' },
      'LMBlp': { tag: 'kbd', text: '   LMB   ', title: 'Long press left mouse button' },
      'RMBd': { tag: 'kbd', text: 'RMB →', title: 'Drag with right mouse button pressed' },

      'ctrl': { tag: 'kbd', text: 'Ctrl', title: 'Control' },
      'shift': { tag: 'kbd', text: 'Shift', title: 'Shift' },

      'del': { tag: 'kbd', text: 'Del', title: 'Delete' },
      'esc': { tag: 'kbd', text: 'Esc', title: 'Escape' },

      ':edge': { tag: 'v-icon', text: '$vuetify.icons.net-edge', title: 'Link or association' },
      ':item': { tag: 'v-icon', text: '$vuetify.icons.net-host', title: 'Port, host, switch, controller, label, link or association' },
      ':node': { tag: 'v-icon', text: '$vuetify.icons.net-host', title: 'Port, host, switch, controller or label' },
      ':swho': { tag: 'v-icon', text: '$vuetify.icons.net-host', title: 'Switch or host' },
      ':port': { tag: 'v-icon', text: '$vuetify.icons.net-port', title: 'Port' }
    },
    nodeIcons: ['port', 'host', 'switch', 'controller', 'dummy'],
    itemIcons: ['edge', 'port', 'host', 'switch', 'controller', 'dummy'],
    swhoIcons: ['host', 'switch'],
    iconsIndex: Math.floor(Math.random() * 100),
    simpleKeyRE: /^[a-z]$/,
    timer: null
  }),
  methods: {
    parse (str) {
      return str.split(' ').map(val => {
        if (this.special[val]) {
          return this.special[val]
        } else if (this.simpleKeyRE.test(val)) {
          const text = val.toUpperCase()
          return { tag: 'kbd', text: text, title: text }
        } else {
          return { tag: 'span', text: ' ' + val + ' ', title: val }
        }
      })
    },
    update () {
      ++this.iconsIndex
      this.special[':node'].text = '$vuetify.icons.net-' + this.nodeIcons[this.iconsIndex % this.nodeIcons.length]
      this.special[':item'].text = '$vuetify.icons.net-' + this.itemIcons[this.iconsIndex % this.itemIcons.length]
      this.special[':swho'].text = '$vuetify.icons.net-' + this.swhoIcons[this.iconsIndex % this.swhoIcons.length]
    }
  },
  mounted () {
    this.update()
    this.timer = window.setInterval(() => this.update(), 2000)
  },
  beforeDestroy () {
    window.clearInterval(this.timer)
  }
}
</script>

<style scoped>
.v-icon {height: 1ex;}
.with-title {cursor: help;}
</style>
