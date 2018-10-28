<template>
  <div ref="vis" :class="action"/>
</template>

<script>
import vis from 'vis'

import controllerImg from '@/assets/network/developer_board.svg'
import hostImg from '@/assets/network/computer.svg'
import portImg from '@/assets/network/port.svg'
import switchImg from '@/assets/network/router.svg'

const actionTypeMap = {
  'add-controller': 'controller',
  'add-dummy': 'dummy',
  'add-host': 'host',
  'add-link': 'link',
  'add-port': 'port',
  'add-switch': 'switch'
}
const portAmounts = {
  'host': 2,
  'switch': 6
}
const nodePriorities = [ 'dummy', 'controller', 'switch', 'host', 'port' ]
const edgeTests = {
  'connection': (src, dst) => src === 'port' && dst === 'port',
  'link': (src, dst) => (
    (src === 'controller' && dst === 'switch') ||
    (src === 'switch' && dst === 'port') ||
    (src === 'host' && dst === 'port') ||
    (src === 'dummy')
  )
}

function isEdge (type) {
  return type === 'connection' || type === 'link'
}

export default {
  name: 'Vis',
  data: () => ({
    action: ''
  }),
  computed: {
    data () {
      return this.$store.state.data
    }
  },
  methods: {
    addEdge () {
      this.action = 'add-edge'
      this.net.addEdgeMode()
    },
    addController () {
      this.action = 'add-controller'
      this.net.addNodeMode()
    },
    addDummy () {
      this.action = 'add-dummy'
      this.net.addNodeMode()
    },
    addHost () {
      this.action = 'add-host'
      this.net.addNodeMode()
    },
    addPort () {
      this.action = 'add-port'
      this.net.addNodeMode()
    },
    addSwitch () {
      this.action = 'add-switch'
      this.net.addNodeMode()
    },
    deleteSelected () {
      const {nodes, edges} = this.net.getSelection()
      this.$store.commit('data/removeItems', [...nodes, ...edges])
      this.net.deleteSelected()
    },
    editItem (node, callback) {
      this.$emit('edit-item', this.data.items[node.id] || {type: node.group}, payload => {
        if (!payload) {
          return callback()
        }

        if (node.from && node.to) {
          payload.from = node.from
          payload.to = node.to
        }

        this.$store.commit('data/setItem', {id: node.id, item: payload})
        node.label = payload.hostname
        node.group = payload.type
        callback(node)
      })
    },
    commitPosition (nodeId) {
      const {x, y} = this.net.getPositions([nodeId])[nodeId]
      this.$store.commit('data/updateItem', {
        id: nodeId,
        item: {x, y}
      })
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
        return 'connection'
      } else {
        return 'link'
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

      const {x, y} = this.net.getPositions([node.id])[node.id]
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
    }
  },
  mounted () {
    const items = Object.keys(this.data.items)
    .map(id => {
      const node = JSON.parse(JSON.stringify(this.data.items[id]))
      node.id = id
      return node
    })

    // create an array with nodes
    const nodes = new vis.DataSet(
      items
      .filter(({type}) => !isEdge(type))
      .map(payload => ({
        id: payload.id,
        label: payload.hostname,
        group: payload.type,
        x: payload.x,
        y: payload.y
      }))
    )
    this.nodes = nodes

    // create an array with edges
    const edges = new vis.DataSet(
      items
      .filter(({type}) => isEdge(type))
      .map(payload => ({
        id: payload.id,
        label: payload.hostname,
        from: payload.from,
        to: payload.to
      }))
    )
    this.edges = edges

    // options
    const options = {
      physics: {
        enabled: false
      },
      edges: {
        smooth: false
      },
      manipulation: {
        enabled: false,
        addNode: (node, callback) => {
          node.group = actionTypeMap[this.action]
          this.action = ''

          this.editItem(node, edited => {
            if (!edited) {
              return callback()
            }

            callback(edited)

            this.commitPosition(edited.id)

            const ports = portAmounts[edited.group] || 0
            if (ports > 0) {
              const {x, y} = this.net.getPositions([edited.id])[edited.id]
              const portY = y + 80
              const firstX = x - (ports - 1) * 50 / 2
              for (let i = 0; i < ports; ++i) {
                const port = {
                  label: `eth${i}`,
                  group: 'port'
                }
                nodes.add(port)
                this.$store.commit('data/setItem', {
                  id: port.id,
                  item: {
                    hostname: port.label,
                    type: 'port'
                  }
                })

                const edge = {
                  id: vis.util.randomUUID(),
                  from: edited.id,
                  to: port.id
                }
                edges.add(edge)
                this.$store.commit('data/setItem', {
                  id: edge.id,
                  item: {
                    type: 'connection',
                    from: edge.from,
                    to: edge.to
                  }
                })
              }
              this.organizePorts(edited)
            }
          })
        },
        editNode: (node, callback) => {
          this.action = ''
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

          this.action = ''
        },
        editEdge: (edge, callback) => {
          this.orderNodes(edge)
          if (this.isEdgeValid(edge, this.getEdgeType(edge))) {
            this.editItem(edge, callback)
          } else {
            callback()
          }

          this.action = ''
        }
      },
      groups: {
        controller: {
          shape: 'image',
          color: 'purple',
          image: controllerImg
        },
        dummy: {
          color: 'dimgray',
          font: {color: 'white'}
        },
        host: {
          shape: 'image',
          color: 'teal',
          image: hostImg
        },
        port: {
          shape: 'image',
          color: 'green',
          size: 10,
          image: portImg
        },
        switch: {
          shape: 'image',
          color: 'teal',
          image: switchImg
        }
      }
    }

    // network
    this.net = new vis.Network(this.$refs.vis, {nodes, edges}, options)
    this.net.on('doubleClick', (event) => {
      if (event.nodes.length === 0 && event.edges.length === 1) {
        const id = event.edges[0]
        this.editItem(edges.get(id), edge => edge ? edges.update(edge) : null)
      } else if (event.nodes.length === 1) {
        this.net.editNode()
      }
    })
    this.net.on('hold', (event) => {
      if (event.nodes.length === 0 && event.edges.length === 1) {
        this.net.editEdgeMode()
      } else if (event.nodes.length === 1) {
        const node = this.nodes.get(event.nodes[0])
        if (node.group === 'host' || node.group === 'switch') {
          this.organizePorts(node)
        }
      }
    })
    this.net.on('dragEnd', (event) => {
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
        const edge = edges.get(edgeId)
        toSelect.add(edge.to)
        toSelect.add(edge.from)
      })
      const toSelectFiltered = [...toSelect]
      .filter(nodeId => this.$store.state.data.items[nodeId].type === 'port')
      if (toSelectFiltered.length) {
        this.net.selectNodes([event.nodes[0], ...toSelectFiltered])
      }
    })
    console.log(this.net, nodes, edges)
  }
}
</script>

<style scoped>
div {position: absolute; width: 100%; height: 100%;}
.add-edge {cursor: url(../assets/cursors/edge.png) 18 18, auto;}
.add-controller {cursor: url(../assets/cursors/controller.png) 18 18, auto;}
.add-dummy {cursor: url(../assets/cursors/dummy.png) 18 18, auto;}
.add-host {cursor: url(../assets/cursors/host.png) 18 18, auto;}
.add-port {cursor: url(../assets/cursors/port.png) 18 18, auto;}
.add-switch {cursor: url(../assets/cursors/switch.png) 18 18, auto;}
</style>
