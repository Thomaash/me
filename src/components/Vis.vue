<template>
  <div class="component-container" tabindex="0" @mousemove="moveMouseTag" @drag="moveMouseTag" @mouseover="focusRoot" @keyup="keypress">
    <VisCanvas v-if="!loading" @ready="init" />
    <v-flex v-else class="text-xs-center" pa-5>
      <v-progress-circular :size="50" color="primary" indeterminate />
    </v-flex>

    <div v-if="newItemType !== ''" :style="{left: mouseTag.x + 'px', top: mouseTag.y + 'px'}" class="mouse-tag">
      <v-icon color="black" v-text="mouseTagIcon" />
    </div>

    <v-snackbar v-model="snackbar.show">
      {{ snackbar.msg }}
      <v-btn color="primary" flat @click="snackbar.action()">
        {{ snackbar.btn }}
      </v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import RectangularSelection from './vis/RectangularSelection'
import VisCanvas from './vis/VisCanvas'
import deselectHandler from './vis/deselectHandler'
import updateNode from './vis/updateNode'
import vis from 'vis'
import { mapGetters } from 'vuex'
import { selection as selectionTheme } from '@/theme'

const portAmounts = {
  'host': 2,
  'switch': 6
}
const nodePriorities = ['dummy', 'controller', 'switch', 'host', 'port']
const edgeTests = {
  'link': (src, dst) => src === 'port' && dst === 'port',
  'association': (src, dst) => (
    (src === 'controller' && dst === 'switch') ||
    (src === 'switch' && dst === 'port') ||
    (src === 'host' && dst === 'port') ||
    (src === 'dummy')
  )
}

const keybindings = {
  'Delete': 'deleteSelected',
  'Escape': 'stopEditMode',
  'a': 'fitAll',
  'c': 'addController',
  'd': 'deleteSelected',
  'e': 'addEdge',
  'f': 'fitSelected',
  'h': 'addHost',
  'l': 'addDummy',
  'p': 'addPort',
  'r': 'redo',
  's': 'addSwitch',
  'u': 'undo',
  'z': 'setScale'
}

const compare = new Intl.Collator(undefined, { numeric: true }).compare
const compareItems = (a, b) => compare(a.label, b.label)

export default {
  name: 'Vis',
  components: { VisCanvas },
  data: () => ({
    newItemType: '',
    mouseTag: {
      x: 0,
      y: 0
    },
    snackbar: {
      show: false,
      msg: '',
      btn: '',
      action: () => {}
    }
  }),
  computed: {
    ...mapGetters('topology', [
      'data'
    ]),
    loading () {
      return this.$store.state.loading
    },
    mouseTagIcon () {
      return '$vuetify.icons.net-' + this.newItemType
    }
  },
  mounted () {
    this.focusRoot()
  },
  methods: {
    moveMouseTag ({ clientX: x, clientY: y }) {
      this.mouseTag.x = x
      this.mouseTag.y = y
    },
    addEdge () {
      this.newItemType = 'edge'
      this.net.addEdgeMode()
    },
    addController () {
      this.newItemType = 'controller'
      this.net.addNodeMode()
    },
    addDummy () {
      this.newItemType = 'dummy'
      this.net.addNodeMode()
    },
    addHost () {
      this.newItemType = 'host'
      this.net.addNodeMode()
    },
    addPort () {
      this.newItemType = 'port'
      this.net.addNodeMode()
    },
    addSwitch () {
      this.newItemType = 'switch'
      this.net.addNodeMode()
    },
    deleteSelected () {
      const { nodes, edges } = this.net.getSelection()
      const count = nodes.length + edges.length

      if (count) {
        this.commit('removeItems', [...nodes, ...edges])
        this.net.deleteSelected()

        this.showSnackbar(`${count} item${count === 1 ? '' : 's'} deleted.`, 'Undo', this.undo)
      }
    },
    fitAll () {
      this.net.fit({ animation: true })
    },
    fitSelected (animate) {
      this.net.fit({
        nodes: this.net.getSelectedNodes(),
        animation: animate == null ? true : !!animate
      })
    },
    setScale (scale) {
      this.net.moveTo({
        scale: scale != null ? scale : 1,
        animation: true
      })
    },
    undo () {
      try {
        this.commit('undo')
        this.showSnackbar('Undone.')
      } catch (error) {
        this.showSnackbar('Nothing more to undo.')
      }
    },
    redo () {
      try {
        this.commit('redo')
        this.showSnackbar('Redone.')
      } catch (error) {
        this.showSnackbar('Nothing more to redo.')
      }
    },
    showSnackbar (msg, btn, action) {
      this.snackbar.show = false
      window.setTimeout(() => {
        this.snackbar.show = true
        this.snackbar.msg = msg || null
        this.snackbar.btn = btn || 'Close'
        this.snackbar.action = () => {
          if (action) {
            action()
          }
          this.snackbar.show = false
        }
      })
    },
    stopEditMode () {
      this.newItemType = ''
      this.net.disableEditMode()
    },
    async editItem (node, commit) {
      const oldItem = this.data.items[node.id] || {
        id: node.id,
        type: node.group
      }

      const item = await new Promise(resolve => {
        this.$emit('edit-item', oldItem, resolve)
      })
      // Ensure the root is focused (there were issues with broken keybindings).
      this.focusRoot()

      if (!item) {
        // Node/edge adding mode is not turned off unless a node/edge is placed.
        this.stopEditMode()
        return {}
      }

      if (node.from && node.to) {
        item.from = node.from
        item.to = node.to
      }
      updateNode(node, item)

      if (commit !== false) {
        this.commit('replaceItems', [item])
      }

      return { node, item }
    },
    commit (type, payload) {
      this.snackbar.show = false
      this.$store.dispatch(`topology/${type}`, payload)
    },
    commitPositions (ids) {
      const positions = this.net.getPositions(ids)
      const updateItems = Object.keys(positions).map(id => ({
        ...positions[id],
        id
      }))
      this.commit('updateItems', updateItems)
    },
    commitUncommitedPositions () {
      const updated = this.nodes.get()
        .filter(({ x, y }) => x == null || y == null)
        .map(({ id }) => id)
      if (updated.length) {
        this.commitPositions(updated)
      }
    },
    orderNodes (edge) {
      const src = this.data.items[edge.from].type
      const dst = this.data.items[edge.to].type
      if (nodePriorities.indexOf(src) > nodePriorities.indexOf(dst)) {
        const tmp = edge.from
        edge.from = edge.to
        edge.to = tmp
      }
    },
    getEdgeType (edge) {
      const item = this.data.items[edge.id]
      if (item && item.type) {
        return item.type
      }

      const src = this.data.items[edge.from].type
      const dst = this.data.items[edge.to].type
      if (src === 'port' && dst === 'port') {
        return 'link'
      } else {
        return 'association'
      }
    },
    isEdgeValid (edge, type) {
      const src = this.data.items[edge.from].type
      const dst = this.data.items[edge.to].type
      return edgeTests[type](src, dst)
    },
    generateOrganizedPortCoors ({ x, y }, ports) {
      const xOffset = ports <= 8 ? 50 : 30
      const yEvenOffset = ports <= 8 ? 0 : 25
      const portY = y + 70
      const firstX = x - (ports - 1) * xOffset / 2

      return [...Array(ports)].map((_v, i) => ({
        x: firstX + xOffset * i,
        y: portY + (i % 2 === 0 ? yEvenOffset : 0)
      }))
    },
    organizePorts (node) {
      const ports = this.net.getConnectedNodes(node.id)
        .map(id => this.nodes.get(id))
        .filter(node => node.group === 'port')
        .sort(compareItems)
      const coords = this.generateOrganizedPortCoors(
        this.net.getPositions([node.id])[node.id],
        ports.length
      )

      this.commit('updateItems',
        coords.map((coords, i) => ({
          ...coords,
          id: ports[i].id
        }))
      )
    },
    getClosest (x, y, types) {
      const ids = this.nodes.getIds()
        .filter(id => types.indexOf(this.data.items[id].type) !== -1)
      const positions = this.net.getPositions(ids)
      const distances = ids.map(id => Math.hypot(positions[id].x - x, positions[id].y - y))
      const closestIndex = distances.reduce((acc, val, i) => val < distances[acc] ? i : acc, 0)
      return {
        id: ids[closestIndex],
        distance: distances[closestIndex]
      }
    },
    focusRoot () {
      this.$el.focus()
    },
    keypress ({ key }) {
      (this[keybindings[key]] || (() => {}))()
    },
    init ({ container, net, nodes, edges }) {
      this.net = net
      this.nodes = nodes
      this.edges = edges

      // Save new positions if any missing
      this.commitUncommitedPositions()

      // Manipulation
      this.net.setOptions({
        manipulation: {
          enabled: false,
          addNode: async (node, callback) => {
            callback() // Node will be added via reactivity from Vuex

            node.group = this.newItemType
            this.newItemType = ''

            const { node: edited, item } = await this.editItem(node, false)
            if (!edited) {
              return
            }

            item.x = edited.x
            item.y = edited.y
            const items = [item]

            if (edited.group === 'port') {
              const { x, y } = edited
              const closest = this.getClosest(x, y, ['host', 'switch'])
              if (closest.distance <= 500) {
                const closestId = closest.id
                const association = {
                  id: vis.util.randomUUID(),
                  from: closestId,
                  to: edited.id
                }
                items.push({
                  id: association.id,
                  type: 'association',
                  from: association.from,
                  to: association.to
                })
              }
            }

            const ports = portAmounts[edited.group] || 0
            if (ports > 0) {
              const coords = this.generateOrganizedPortCoors(edited, ports)
              for (let i = 0; i < ports; ++i) {
                const port = {
                  id: vis.util.randomUUID(),
                  label: `eth${i}`,
                  group: 'port',
                  ...coords[i]
                }
                items.push({
                  id: port.id,
                  hostname: port.label,
                  type: 'port',
                  ...coords[i]
                })

                const edge = {
                  id: vis.util.randomUUID(),
                  from: edited.id,
                  to: port.id
                }
                items.push({
                  id: edge.id,
                  type: 'association',
                  from: edge.from,
                  to: edge.to
                })
              }
            }

            this.commit('replaceItems', items)
          },
          editNode: async (node, callback) => {
            this.newItemType = ''
            const { node: edited } = await this.editItem(node)
            callback(edited)
          },
          addEdge: async (edge, callback) => {
            callback() // Edge will be added via reactivity from Vuex

            this.orderNodes(edge)
            const type = this.getEdgeType(edge)
            if (this.isEdgeValid(edge, type)) {
              edge.id = edge.id || vis.util.randomUUID()
              edge.group = type

              await this.editItem(edge)
            }

            this.newItemType = ''
          },
          editEdge: async (edge, callback) => {
            this.orderNodes(edge)
            if (this.isEdgeValid(edge, this.getEdgeType(edge))) {
              const { node: edited } = await this.editItem(edge)
              callback(edited)
            } else {
              callback()
            }

            this.newItemType = ''
          }
        }
      })

      // Events
      this.net.on('deselectNode', deselectHandler.bind(null, this.net))
      this.net.on('deselectEdge', deselectHandler.bind(null, this.net))
      this.net.on('doubleClick', async event => {
        if (event.nodes.length === 0 && event.edges.length === 1) {
          const id = event.edges[0]
          await this.editItem(this.edges.get(id))
        } else if (event.nodes.length === 1) {
          this.net.editNode()
        }
      })
      this.net.on('hold', event => {
        if (event.nodes.length === 0 && event.edges.length === 1) {
          this.net.editEdgeMode()
        } else if (event.nodes.length === 1) {
          const node = this.nodes.get(event.nodes[0])
          if (node.group === 'host' || node.group === 'switch') {
            this.organizePorts(node)
          }
        }
      })
      this.net.on('dragEnd', event => {
        if (event.nodes.length > 0) {
          this.commitPositions(event.nodes)
        }
      })
      this.net.on('dragStart', event => {
        if (event.nodes.length !== 1) {
          return
        }
        const nodeItem = this.data.items[event.nodes[0]]
        if (!(nodeItem.type === 'host' || nodeItem.type === 'switch')) {
          return
        }

        const toSelect = new Set()
        this.net.getSelectedEdges().forEach(edgeId => {
          const edge = this.edges.get(edgeId)
          toSelect.add(edge.to)
          toSelect.add(edge.from)
        })
        const toSelectFiltered = [...toSelect]
          .filter(nodeId => this.data.items[nodeId].type === 'port')
        if (toSelectFiltered.length) {
          this.net.selectNodes([event.nodes[0], ...toSelectFiltered])
        }
      })

      // Focus item, focus again in case of immediate resize.
      const idsParam = this.$route.params.ids
      if (idsParam) {
        const ids = idsParam.split(',')
        const fitSelection = animate => {
          this.net.setSelection({
            nodes: ids.filter(id => this.nodes.get(id)),
            edges: ids.filter(id => this.edges.get(id))
          })
          this.fitSelected(animate)
        }
        this.net.on('resize', fitSelection)
        window.setTimeout(() => this.net.off('resize', fitSelection), 4000)
        fitSelection(false)
      }

      // Set rectangular selection up
      const rs = new RectangularSelection(container, this.net, this.nodes, selectionTheme)
      rs.attach()

      // @todo - debug
      window.net = this.net
      window.nodes = this.nodes
      window.edges = this.edges
    }
  }
}
</script>

<style scoped>
.component-container {position: relative; width: 100%; height: 100%;}
/* Content resizing glitch workaround. */
.component-container {max-height: calc(100vh - 64px);}

.mouse-tag {position: fixed; margin: 1em;}
</style>

<style>
.vis-tooltip {
  background: rgba(255, 255, 255, 0.9);
  border: grey 1px solid;
  padding: 1ex;
  position: absolute;
  white-space: nowrap;
}
.vis-tooltip td {padding-left: 1ex;}
.vis-tooltip td:first-child {padding-left: unset;}

.component-container {outline: none;}
.component-container * {outline: none;}
</style>
