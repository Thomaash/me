<template>
  <div ref="container" :style="{ width: widthStyle, height: heightStyle }" class="vis-container">
    <div ref="vis" class="vis-root" />
  </div>
</template>

<script>
import generateTooltip from './generateTooltip'
import labelPlaceholders from './placeholders'
import { DataSet } from 'vis-data/peer'
import { Network } from 'vis-network/peer'
import { items as theme } from '@/theme'
import { mapGetters } from 'vuex'

import 'vis-network/styles/vis-network.css'

import controllerImg from '@/assets/network/controller.svg'
import hostImg from '@/assets/network/host.svg'
import portImg from '@/assets/network/port.svg'
import switchImg from '@/assets/network/switch.svg'

export default {
  name: 'VisCanvas',
  data: () => ({
    width: null,
    height: null,
    cleanUpCallbacks: [],
    labelPlaceholders
  }),
  computed: {
    ...mapGetters('topology', [
      'data',
      'boundingBox'
    ]),
    widthStyle () {
      return this.width == null
        ? undefined
        : `${this.width}px`
    },
    heightStyle () {
      return this.height == null
        ? undefined
        : `${this.height}px`
    },
    storeActions () {
      return {
        'topology/importData': () => {
          this.replaceItems()
        },
        'topology/applyChange': ({ remove, update, replace }) => {
          const ids = [
            ...(remove || []),
            ...[...(update || []), ...(replace || [])]
              .map(item => item.id)
          ]
          const nodes = []
          const edges = []

          // Save old neighbors for label update
          const updatedIds = new Set([].concat(
            ...ids,
            ...ids.map(id => this.net.getConnectedNodes(id))
          ))

          if (update) {
            Object.values(update).forEach(itemUpdate => {
              const item = {
                ...this.data.items[itemUpdate.id],
                ...itemUpdate
              }

              if (this.isEdge(item.type)) {
                edges.push(this.itemToEdge(item))
              } else {
                nodes.push(this.itemToNode(item))
              }
            })
          }

          if (replace) {
            Object.values(replace).forEach(item => {
              if (this.isEdge(item.type)) {
                edges.push(this.itemToEdge(item))
              } else {
                nodes.push(this.itemToNode(item))
              }
            })
          }

          // Update Vis
          if (ids.length) {
            this.nodes.remove(ids)
            this.edges.remove(ids)
          }
          if (nodes.length) {
            this.nodes.add(nodes)
          }
          if (edges.length) {
            this.edges.add(edges)
          }

          // Save new neighbors for label update
          ids.forEach(id =>
            this.net.getConnectedNodes(id)
              .forEach(id => updatedIds.add(id))
          )

          // Update label texts
          this.updateLabels([...updatedIds].filter(id => this.data.items[id]))
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
        // Invisible border, 0 makes selected border dissapear
        borderWidth: 0.0001,
        borderWidthSelected: 2,
        font: {
          face: 'Source Sans Pro'
        },
        shapeProperties: {
          borderRadius: 6,
          useBorderWithImage: true
        },
        scaling: {
          label: {
            // Don't hide labels while zooming in too much (useful for image export)
            maxVisible: Number.MAX_SAFE_INTEGER
          }
        }
      },
      edges: {
        smooth: false
      },
      interaction: {
        hover: true,
        navigationButtons: false,
        keyboard: false
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
          font: {
            color: theme.dummy,
            face: 'Source Code Pro',
            align: 'left'
          },
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

    // Create and fill datasets
    const nodes = this.nodes = new DataSet()
    const edges = this.edges = new DataSet()
    // It's necessary to load the items now, otherwise the network would be labeld as ready before the items are visible.
    this.replaceItems()

    // Create the network
    const net = new Network(this.$refs.vis, { nodes, edges }, options)
    this.net = net
    this.cleanUpCallbacks.push(() => {
      net.destroy()
    })

    // Some labels contain placeholders for info from connected nodes.
    // Therefore this can't be done before the topology is built.
    this.updateLabels()

    this.cleanUpCallbacks.push(this.$store.subscribe(({ type, payload }, { data }) => {
      ;(this.storeActions[type] || (() => {}))(payload, data)
    }))

    this.$emit('ready', { container, net, nodes, edges })
  },
  beforeDestroy () {
    this.cleanUpCallbacks.forEach(clb => {
      try {
        clb()
      } catch (error) {
        console.error(error)
      }
    })
  },
  methods: {
    itemToNode (item) {
      return {
        id: item.id,
        group: item.type,
        x: item.x,
        y: item.y,
        label: item.type === 'dummy' ? this.processLabel(item) : item.hostname,
        title: generateTooltip(item)
      }
    },
    itemToEdge (item) {
      return {
        id: item.id,
        from: item.from,
        to: item.to,
        label: item.hostname,
        title: generateTooltip(item)
      }
    },
    processLabel (item) {
      if (!this.net) {
        return item.hostname
      }

      const neighbors = this.net.getConnectedNodes(item.id)
        .map(id => this.data.items[id])
      return item.hostname.replace(this.labelPlaceholders.re, match => {
        return (
          this.labelPlaceholders.replace[match.toUpperCase()] ||
          this.labelPlaceholders.replace.fallback
        )(neighbors, match)
      })
    },
    updateLabels (ids) {
      this.nodes.update(
        (ids || this.nodes.getIds())
          .map(id => this.data.items[id])
          .filter(item => item.type === 'dummy')
          .map(item => this.itemToNode(item))
      )
    },
    replaceItems () {
      // Preprocess items
      const items = Object.keys(this.data.items)
        .map(id => {
          const node = JSON.parse(JSON.stringify(this.data.items[id]))
          node.id = id
          return node
        })

      // Nodes
      this.nodes.clear()
      this.nodes.add(items
        .filter(({ type }) => !this.isEdge(type))
        .map(this.itemToNode))

      // Edges
      this.edges.clear()
      this.edges.add(items
        .filter(({ type }) => this.isEdge(type))
        .map(this.itemToEdge))

      // Some labels contain placeholders for info from connected nodes.
      // Therefore this can't be done before the topology is built.
      if (this.net) {
        this.updateLabels()
      }
    },
    async toBlob ({ width, height, scale } = { scale: 1 }, fallback = false, progressObserver = () => {}) {
      const bb = await this.boundingBox({ scale })

      // Solve rounding issues (usually ±1 px)
      // Ensures that the user gets the size they see
      if (width) {
        bb.width = width
      }
      if (height) {
        bb.height = height
      }

      // Rendering zero sized images doesn't work nor makes sense
      if (!bb.width || !bb.height) {
        throw new RangeError('Image has to have non-zero size.')
      }

      const beforeDrawingHandler = ctx => {
        const { x, y } = this.net.view.targetTranslation
        const scale = this.net.view.targetScale
        ctx.fillStyle = '#fff'
        ctx.fillRect(
          -x / scale - 1,
          -y / scale - 1,
          ctx.canvas.width / scale + 2,
          ctx.canvas.height / scale + 2
        )
      }

      this.net.on('beforeDrawing', beforeDrawingHandler)

      try {
        return fallback
          ? await this._toBlobJimp(bb, scale, progressObserver)
          : await this._toBlobNative(bb, scale, progressObserver)
      } finally {
        this.net.off('beforeDrawing', beforeDrawingHandler)
      }
    },
    async _toBlobNative (bb, scale, progressObserver) {
      // Resize the canvas to image size
      await new Promise(resolve => {
        const handler = () => {
          this.net.off('resize', handler)
          resolve()
        }

        this.net.on('resize', handler)
        this.width = bb.width
        this.height = bb.height
      })

      // Fit all items into the view and scale accordingly
      this.net.fit()
      this.net.moveTo({
        scale,
        animation: false
      })

      // Render image blob
      const blob = await new Promise(resolve => {
        const handler = ctx => {
          this.net.off('afterDrawing', handler)
          ctx.canvas.toBlob(resolve, 'image/png')
        }

        this.net.on('afterDrawing', handler)
        this.net.redraw()
      })

      this.width = null
      this.height = null

      if (blob) {
        return {
          blob,
          width: bb.width,
          height: bb.height
        }
      } else {
        throw new Error('Image size is probably out of limits.')
      }
    },
    _toBlobJimp (bb, scale, progressObserver) {
      return (async (resolve, reject) => {
        const tileSize = 1000

        // Compute the number of columns and rows of tiles
        const cols = Math.ceil(bb.width / tileSize)
        const rows = Math.ceil(bb.height / tileSize)

        // Offset for Vis coordinates, Vis always points to the center, not topleft corner
        const offset = {
          x: -(bb.sX + tileSize / 2),
          y: -(bb.sY + tileSize / 2)
        }

        // Init the worker and it's clean up function
        const worker = new Worker('./JoinImages.worker.js', { type: 'module' })
        const terminateWorker = () => {
          this.cleanUpCallbacks.splice(this.cleanUpCallbacks.indexOf(terminateWorker), 1)
          worker.terminate()
        }
        this.cleanUpCallbacks.push(terminateWorker)

        worker.onmessage = event => {
          const { progress, blob, errorMsg } = event.data
          progressObserver(progress)
          if (progress === 1) {
            if (blob) {
              resolve({
                blob,
                width: bb.width,
                height: bb.height
              })
            } else {
              reject(new Error(`Image rendering failed: ${errorMsg}.`))
            }

            terminateWorker()
            this.width = null
            this.height = null
          }
        }

        // Prepare empty image in the worker
        worker.postMessage({
          type: 'init',
          payload: {
            width: bb.width,
            height: bb.height,
            tileSize,
            cols,
            rows
          }
        })

        // Resize the canvas to tile size
        await new Promise(resolve => {
          const handler = () => {
            this.net.off('resize', handler)
            resolve()
          }

          this.net.on('resize', handler)
          this.width = tileSize
          this.height = tileSize
        })

        // Apply scale
        this.net.moveTo({
          scale,
          animation: false
        })

        // Render the tiles
        for (let row = 0; row < rows; ++row) {
          for (let col = 0; col < cols; ++col) {
            // Move the viewport
            this.net.moveTo({
              position: { x: 0, y: 0 },
              offset: {
                x: offset.x - tileSize * col,
                y: offset.y - tileSize * row
              },
              animation: false
            })

            // Render image blob
            const blob = await new Promise(resolve => {
              const handler = ctx => {
                this.net.off('afterDrawing', handler)
                ctx.canvas.toBlob(resolve, 'image/png')
              }

              this.net.on('afterDrawing', handler)
              this.net.redraw()
            })

            // Send the tile blob to the worker
            worker.postMessage({
              type: 'add-tile',
              payload: {
                blob,
                col,
                row
              }
            })
          }
        }
      })()
    },
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
  }
}
</script>

<style scoped>
.vis-container {position: relative; width: 100%; height: 100%;}
.vis-container > * {position: absolute; top: 0px; right: 0px; bottom: 0px; left: 0px;}
</style>
