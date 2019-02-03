<template>
  <div class="component-container" tabindex="0" @mousemove="moveMouseTag" @drag="moveMouseTag" @mouseover="focusRoot" @keyup="keypress">
    <VisCanvas v-if="!loading" @ready="init" />
    <v-flex v-else class="text-xs-center" pa-5>
      <v-progress-circular :size="50" color="primary" indeterminate />
    </v-flex>

    <div v-if="newItem.type !== ''" :style="{left: mouseTag.x + 'px', top: mouseTag.y + 'px'}" class="mouse-tag">
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
import vis from 'vis'
import { compare, compareNodes } from './vis/locale'
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
const baseHostnames = {
  'controller': 'c1',
  'host': 'h1',
  'port': 'eth0',
  'switch': 's1'
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
  'i': 'addIPsDummy',
  'l': 'addDummy',
  'p': 'addPort',
  'r': 'redo',
  's': 'addSwitch',
  't': 'addTypesDummy',
  'u': 'undo',
  'z': 'setScale'
}

export default {
  name: 'Vis',
  components: { VisCanvas },
  data: () => ({
    newItem: {
      type: null,
      connectTo: null,
      label: null,
      set (type, connectTo, label) {
        this.type = type || null
        this.connectTo = connectTo || null
        this.label = label || null
      }
    },
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
      return '$vuetify.icons.net-' + this.newItem.type
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
      this.newItem.set('edge')
      this.net.addEdgeMode()
    },
    addController () {
      this.newItem.set('controller')
      this.net.addNodeMode()
    },
    addDummy () {
      this.newItem.set('dummy')
      this.net.addNodeMode()
    },
    addIPsDummy () {
      this.newItem.set('dummy', ['port', 'host', 'switch', 'controller'], '{{IPS}}')
      this.net.addNodeMode()
    },
    addTypesDummy () {
      this.newItem.set('dummy', ['switch', 'controller'], '{{TYPES}}')
      this.net.addNodeMode()
    },
    addHost () {
      this.newItem.set('host')
      this.net.addNodeMode()
    },
    addPort () {
      this.newItem.set('port', ['host', 'switch'])
      this.net.addNodeMode()
    },
    addSwitch () {
      this.newItem.set('switch')
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
      this.newItem.set()
      this.net.disableEditMode()
    },
    async editItem (node, commit) {
      const oldItem = this.data.items[node.id] || {
        id: node.id,
        type: node.group,
        hostname: node.label
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
    getConnectedNodes (id, type) {
      return this.net.getConnectedNodes(id)
        .map(id => this.nodes.get(id))
        .filter(node => node.group === type)
    },
    organizePorts (node) {
      const ports = this.getConnectedNodes(node.id, 'port')
        .sort(compareNodes)
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
    getNextHostname (hostnames, fallback) {
      if (!hostnames.length) {
        return fallback
      }

      const prevHostname = hostnames.sort(compare)[hostnames.length - 1]
      const res = /^(.*?)(\d+)([^\d]*?)$/.exec(prevHostname)
      if (res == null) {
        return fallback
      }

      const [, pre, nm, post] = res
      const nextLabel = `${pre}${+nm + 1}${post}`
      return nextLabel
    },
    getNextFreeHostname (type, rootNodeId) {
      if (type === 'port') { // Local namespace
        if (rootNodeId == null) {
          return baseHostnames[type]
        }

        return this.getNextHostname(
          this.getConnectedNodes(rootNodeId, type)
            .map(({ id }) => this.data.items[id].hostname),
          baseHostnames[type]
        )
      } else { // Global namespace
        return this.getNextHostname(
          this.nodes.get()
            .filter(node => node.group === type)
            .map(({ id }) => this.data.items[id].hostname),
          baseHostnames[type]
        )
      }
    },
    getClosestId (x, y, types, maxDistance) {
      const ids = this.nodes.getIds()
        .filter(id => types.indexOf(this.data.items[id].type) !== -1)
      const positions = this.net.getPositions(ids)
      const distances = ids.map(id => Math.hypot(positions[id].x - x, positions[id].y - y))
      const closestIndex = distances.reduce((acc, val, i) => val < distances[acc] ? i : acc, 0)

      return distances[closestIndex] <= maxDistance
        ? ids[closestIndex]
        : null
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

            const newItem = { ...this.newItem }
            this.newItem.set()

            node.group = newItem.type
            node.label = newItem.label

            const closestId = newItem.connectTo
              ? this.getClosestId(node.x, node.y, newItem.connectTo, 500)
              : null
            node.label = newItem.label || (
              baseHostnames[node.group]
                ? this.getNextFreeHostname(node.group, closestId)
                : ''
            )

            const { node: edited, item } = await this.editItem(node, false)
            if (!edited) {
              return
            }

            item.x = edited.x
            item.y = edited.y
            const items = [item]

            if (closestId != null) {
              const association = {
                id: vis.util.randomUUID()
              }

              if (nodePriorities.indexOf(item.type) > nodePriorities.indexOf(this.data.items[closestId].type)) {
                association.from = closestId
                association.to = edited.id
              } else {
                association.from = edited.id
                association.to = closestId
              }

              items.push({
                id: association.id,
                type: 'association',
                from: association.from,
                to: association.to
              })
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
            this.newItem.set()
            await this.editItem(node)
            callback()
          },
          addEdge: async (edge, callback) => {
            callback() // Edge will be added via reactivity from Vuex

            this.orderNodes(edge)
            const type = this.getEdgeType(edge)
            if (this.isEdgeValid(edge, type)) {
              edge.id = edge.id || vis.util.randomUUID()
              edge.group = type
              edge.label = ''

              await this.editItem(edge)
            }

            this.newItem.set()
          },
          editEdge: async (edge, callback) => {
            this.orderNodes(edge)
            if (this.isEdgeValid(edge, this.getEdgeType(edge))) {
              await this.editItem(edge)
              callback()
            } else {
              callback()
            }

            this.newItem.set()
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
