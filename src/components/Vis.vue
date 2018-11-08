<template>
  <div class="vis-container" @mousemove="moveMouseTag" @drag="moveMouseTag" tabindex="0" @mouseover="focusRoot" @keyup="keypress">
    <VisCanvas v-if="!loading" @ready="init"/>
    <div v-else>Loading…</div>
    <div class="mouse-tag" v-if="newItemType !== ''" :style="{left: mouseTag.x + 'px', top: mouseTag.y + 'px'}">
      <v-icon v-text="mouseTagIcon" color="black"/>
    </div>
  </div>
</template>

<script>
import RectangularSelection from './vis/RectangularSelection'
import VisCanvas from './vis/VisCanvas'
import deselectHandler from './vis/deselectHandler'
import updateNode from './vis/updateNode'
import vis from 'vis'
import { selection as selectionTheme } from '@/theme'

const portAmounts = {
  'host': 2,
  'switch': 6
}
const nodePriorities = [ 'dummy', 'controller', 'switch', 'host', 'port' ]
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
  's': 'addSwitch',
  'z': 'setScale'
}

export default {
  name: 'Vis',
  components: { VisCanvas },
  data: () => ({
    newItemType: '',
    mouseTag: {
      x: 0,
      y: 0
    }
  }),
  computed: {
    data () {
      return this.$store.state.data
    },
    loading () {
      return this.$store.state.loading
    },
    mouseTagIcon () {
      return '$vuetify.icons.net-' + this.newItemType
    }
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
      this.$store.commit('data/removeItems', [...nodes, ...edges])
      this.net.deleteSelected()
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
    stopEditMode () {
      this.newItemType = ''
      this.net.disableEditMode()
    },
    editItem (node, callback) {
      const oldItem = this.data.items[node.id] || {
        id: node.id,
        type: node.group
      }
      this.$emit('edit-item', oldItem, item => {
        if (!item) {
          // Node/edge adding mode is not turned off unless a node/edge is placed.
          this.stopEditMode()
          return callback()
        }

        if (node.from && node.to) {
          item.from = node.from
          item.to = node.to
        }

        this.$store.commit('data/setItem', item)
        updateNode(node, item)
        callback(node)
      })
    },
    commitPosition (id) {
      const { x, y } = this.net.getPositions([id])[id]
      this.$store.commit('data/updateItem', { id, x, y })
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
      const src = this.$store.state.data.items[edge.from].type
      const dst = this.$store.state.data.items[edge.to].type
      return edgeTests[type](src, dst)
    },
    organizePorts (node) {
      const ports = this.net.getConnectedNodes(node.id)
        .map(id => this.nodes.get(id))
        .filter(node => node.group === 'port')
        .sort((n1, n2) => (n1.label || '').localeCompare(n2.label || ''))

      const { x, y } = this.net.getPositions([node.id])[node.id]
      const xOffset = ports.length <= 8 ? 50 : 30
      const yEvenOffset = ports.length <= 8 ? 0 : 25
      const portY = y + 70
      const firstX = x - (ports.length - 1) * xOffset / 2

      ports.forEach((port, i) => {
        port.x = firstX + xOffset * i
        port.y = portY + (i % 2 === 0 ? yEvenOffset : 0)
        this.nodes.update(port)
        this.commitPosition(port.id)
      })
    },
    getClosest (x, y, types) {
      const ids = this.nodes.getIds()
        .filter(id => types.indexOf(this.$store.state.data.items[id].type) !== -1)
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

      // Manipulation
      this.net.setOptions({
        manipulation: {
          enabled: false,
          addNode: (node, callback) => {
            node.group = this.newItemType
            this.newItemType = ''

            this.editItem(node, edited => {
              if (!edited) {
                return callback()
              }

              callback(edited)

              this.commitPosition(edited.id)

              if (edited.group === 'port') {
                const { x, y } = this.net.getPositions(edited.id)[edited.id]
                const closest = this.getClosest(x, y, ['host', 'switch'])
                if (closest.distance <= 500) {
                  const closestId = closest.id
                  const association = {
                    id: vis.util.randomUUID(),
                    from: closestId,
                    to: edited.id
                  }
                  this.edges.add(association)
                  this.$store.commit('data/setItem', {
                    id: association.id,
                    type: 'association',
                    from: association.from,
                    to: association.to
                  })
                }
              }

              const ports = portAmounts[edited.group] || 0
              if (ports > 0) {
                for (let i = 0; i < ports; ++i) {
                  const port = {
                    label: `eth${i}`,
                    group: 'port'
                  }
                  this.nodes.add(port)
                  this.$store.commit('data/setItem', {
                    id: port.id,
                    hostname: port.label,
                    type: 'port'
                  })

                  const edge = {
                    id: vis.util.randomUUID(),
                    from: edited.id,
                    to: port.id
                  }
                  this.edges.add(edge)
                  this.$store.commit('data/setItem', {
                    id: edge.id,
                    type: 'association',
                    from: edge.from,
                    to: edge.to
                  })
                }
                this.organizePorts(edited)
              }
            })
          },
          editNode: (node, callback) => {
            this.newItemType = ''
            this.editItem(node, callback)
          },
          addEdge: (edge, callback) => {
            this.orderNodes(edge)
            const type = this.getEdgeType(edge)
            if (this.isEdgeValid(edge, type)) {
              edge.id = edge.id || vis.util.randomUUID()
              edge.group = type

              this.editItem(edge, callback)
            } else {
              callback()
            }

            this.newItemType = ''
          },
          editEdge: (edge, callback) => {
            this.orderNodes(edge)
            if (this.isEdgeValid(edge, this.getEdgeType(edge))) {
              this.editItem(edge, callback)
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
      this.net.on('doubleClick', event => {
        if (event.nodes.length === 0 && event.edges.length === 1) {
          const id = event.edges[0]
          this.editItem(this.edges.get(id), edge => edge ? this.edges.update(edge) : null)
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
          event.nodes.forEach(nodeId => this.commitPosition(nodeId))
        }
      })
      this.net.on('dragStart', event => {
        if (event.nodes.length !== 1) {
          return
        }
        const nodeItem = this.$store.state.data.items[event.nodes[0]]
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
          .filter(nodeId => this.$store.state.data.items[nodeId].type === 'port')
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
  },
  mounted () {
    this.focusRoot()
  }
}
</script>

<style scoped>
.vis-container {position: absolute; width: 100%; height: 100%;}
/* Content resizing glitch workaround. */
.vis-container {max-height: calc(100vh - 64px);}

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

.vis-container {outline: none;}
.vis-container * {outline: none;}
</style>
