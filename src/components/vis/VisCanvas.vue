<template>
  <div ref="container" class="vis-container" :style="{ width: width, height: height }">
    <div class="vis-root" ref="vis"/>
  </div>
</template>

<script>
import updateNode from './updateNode'
import vis from 'vis'
import { items as theme } from '@/theme'

import controllerImg from '@/assets/network/controller.svg'
import hostImg from '@/assets/network/host.svg'
import portImg from '@/assets/network/port.svg'
import switchImg from '@/assets/network/switch.svg'

export default {
  name: 'VisCanvas',
  props: {
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '100%'
    }
  },
  data: () => ({}),
  computed: {
    data () {
      return this.$store.state.data
    }
  },
  methods: {
    isEdge (type) {
      return type === 'link' || type === 'association'
    },
    buildGroupColor (primary, bg, alwaysBorder) {
      bg = bg || 'rgba(0, 0, 0, 0)'
      return {
        background: bg,
        border: primary,
        highlight: {
          background: bg,
          border: primary
        },
        hover: {
          background: bg,
          border: primary
        }
      }
    }
  },
  mounted () {
    const container = this.$refs.container
    const options = {
      physics: {
        enabled: false
      },
      nodes: {
        borderWidth: 0.0001,
        borderWidthSelected: 2,
        shapeProperties: {
          borderRadius: 6,
          useBorderWithImage: true
        }
      },
      edges: {
        smooth: false
      },
      interaction: {
        hover: true
      },
      manipulation: {
        enabled: false
      },
      groups: {
        controller: {
          shape: 'image',
          color: this.buildGroupColor(theme.controller),
          size: 25,
          image: controllerImg
        },
        dummy: {
          shape: 'box',
          color: this.buildGroupColor(theme.dummy, '#fff', true),
          font: { color: theme.dummy },
          borderWidth: 1
        },
        host: {
          shape: 'image',
          color: this.buildGroupColor(theme.host),
          size: 25,
          image: hostImg
        },
        port: {
          shape: 'image',
          color: this.buildGroupColor(theme.port),
          size: 10,
          image: portImg
        },
        switch: {
          shape: 'image',
          color: this.buildGroupColor(theme.switch),
          size: 25,
          image: switchImg
        }
      }
    }

    // Preprocess items
    const items = Object.keys(this.data.items)
      .map(id => {
        const node = JSON.parse(JSON.stringify(this.data.items[id]))
        node.id = id
        return node
      })

    // Create an array with nodes
    const nodes = new vis.DataSet(
      items
        .filter(({ type }) => !this.isEdge(type))
        .map(item => updateNode({
          id: item.id,
          group: item.type,
          x: item.x,
          y: item.y
        }, item))
    )

    // Create an array with edges
    const edges = new vis.DataSet(
      items
        .filter(({ type }) => this.isEdge(type))
        .map(item => updateNode({
          id: item.id,
          from: item.from,
          to: item.to
        }, item))
    )

    // Create the network
    const net = new vis.Network(this.$refs.vis, { nodes, edges }, options)

    this.$emit('ready', { container, net, nodes, edges })
  }
}
</script>

<style scoped>
.vis-container {position: relative;}
.vis-container > * {position: absolute; top: 0px; right: 0px; bottom: 0px; left: 0px;}
</style>
