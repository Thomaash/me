<template>
  <div
    ref="container"
    :style="{ width: widthStyle, height: heightStyle }"
    class="vis-container"
  >
    <div ref="vis" class="vis-root" />
  </div>
</template>

<script>
import generateTooltip from "./generateTooltip";
import labelPlaceholders from "./placeholders";
import { DataSet } from "vis-data/peer";
import { Network } from "vis-network/peer";
import { canvasDark, canvasLight, itemsDark, itemsLight } from "@/theme";
import colors from "vuetify/es5/util/colors";
import { mapGetters } from "vuex";

import "vis-network/styles/vis-network.css";

import controllerImgDark from "@/assets/network/controller.dark.svg";
import controllerImgLight from "@/assets/network/controller.light.svg";
import hostImgDark from "@/assets/network/host.dark.svg";
import hostImgLight from "@/assets/network/host.light.svg";
import portImgDark from "@/assets/network/port.dark.svg";
import portImgLight from "@/assets/network/port.light.svg";
import switchImgDark from "@/assets/network/switch.dark.svg";
import switchImgLight from "@/assets/network/switch.light.svg";

export default {
  name: "VisCanvas",
  props: {
    dark: {
      required: true,
      type: Boolean,
    },
  },
  data: () => ({
    width: null,
    height: null,
    cleanUpCallbacks: [],
    labelPlaceholders,
  }),
  computed: {
    ...mapGetters("topology", ["data", "boundingBox"]),
    theme() {
      return {
        images: {
          controller: this.dark ? controllerImgDark : controllerImgLight,
          host: this.dark ? hostImgDark : hostImgLight,
          port: this.dark ? portImgDark : portImgLight,
          switch: this.dark ? switchImgDark : switchImgLight,
        },
        items: {
          controller: this.dark ? itemsDark.controller : itemsLight.controller,
          dummy: this.dark ? itemsDark.dummy : itemsLight.dummy,
          host: this.dark ? itemsDark.host : itemsLight.host,
          port: this.dark ? itemsDark.port : itemsLight.port,
          switch: this.dark ? itemsDark.switch : itemsLight.switch,
        },
        foreground: this.dark ? canvasDark.foreground : canvasLight.foreground,
        background: this.dark ? canvasDark.background : canvasLight.background,
      };
    },
    options() {
      return {
        physics: {
          enabled: false,
        },
        nodes: {
          // Invisible border, 0 makes selected border dissapear
          borderWidth: 0.0001,
          borderWidthSelected: 2,
          font: {
            align: "center",
            color: this.theme.foreground,
            face: "Source Sans Pro",
            strokeWidth: 0,
          },
          shapeProperties: {
            borderRadius: 6,
            useBorderWithImage: true,
          },
          scaling: {
            label: {
              // Don't hide labels while zooming in too much (useful for image export)
              maxVisible: Number.MAX_SAFE_INTEGER,
            },
          },
        },
        edges: {
          smooth: false,
          font: {
            align: "top",
            color: this.theme.foreground,
            face: "Source Sans Pro",
            strokeWidth: 0,
          },
        },
        interaction: {
          hover: true,
          navigationButtons: false,
          keyboard: false,
        },
        manipulation: {
          enabled: false,
        },
        groups: {
          controller: {
            shape: "image",
            color: this.buildGroupColor(this.theme.items.controller),
            size: 25,
            image: this.theme.images.controller,
          },
          dummy: {
            shape: "box",
            color: this.buildGroupColor(this.theme.items.dummy, true),
            font: {
              color: this.theme.foreground,
              face: "Source Code Pro",
              align: "left",
            },
            borderWidth: 1,
          },
          host: {
            shape: "image",
            color: this.buildGroupColor(this.theme.items.host),
            size: 25,
            image: this.theme.images.host,
          },
          port: {
            shape: "image",
            color: this.buildGroupColor(this.theme.items.port),
            size: 10,
            image: this.theme.images.port,
          },
          switch: {
            shape: "image",
            color: this.buildGroupColor(this.theme.items.switch),
            size: 25,
            image: this.theme.images.switch,
          },
        },
      };
    },
    widthStyle() {
      return this.width == null ? undefined : `${this.width}px`;
    },
    heightStyle() {
      return this.height == null ? undefined : `${this.height}px`;
    },
    storeActions() {
      return {
        "topology/importData": () => {
          this.replaceItems();
        },
        "topology/applyChange": ({ remove, update, replace }) => {
          const ids = [
            ...(remove || []),
            ...[...(update || []), ...(replace || [])].map((item) => item.id),
          ];
          const nodes = [];
          const edges = [];

          // Save old neighbors for label update
          const updatedIds = new Set(
            [].concat(
              ...ids,
              ...ids.map((id) => this.net.getConnectedNodes(id))
            )
          );

          if (update) {
            Object.values(update).forEach((itemUpdate) => {
              const item = {
                ...this.data.items[itemUpdate.id],
                ...itemUpdate,
              };

              if (this.isEdge(item.type)) {
                edges.push(this.itemToEdge(item));
              } else {
                nodes.push(this.itemToNode(item));
              }
            });
          }

          if (replace) {
            Object.values(replace).forEach((item) => {
              if (this.isEdge(item.type)) {
                edges.push(this.itemToEdge(item));
              } else {
                nodes.push(this.itemToNode(item));
              }
            });
          }

          // Update Vis
          if (ids.length) {
            this.nodes.remove(ids);
            this.edges.remove(ids);
          }
          if (nodes.length) {
            this.nodes.add(nodes);
          }
          if (edges.length) {
            this.edges.add(edges);
          }

          // Save new neighbors for label update
          ids.forEach((id) =>
            this.net.getConnectedNodes(id).forEach((id) => updatedIds.add(id))
          );

          // Update label texts
          this.updateLabels(
            [...updatedIds].filter((id) => this.data.items[id])
          );
        },
      };
    },
  },
  watch: {
    options(v) {
      this.net.setOptions(v);
    },
  },
  mounted() {
    const container = this.$refs.container;
    const options = this.options;

    // Create and fill datasets
    const nodes = (this.nodes = new DataSet());
    const edges = (this.edges = new DataSet());
    // It's necessary to load the items now, otherwise the network would be labeld as ready before the items are visible.
    this.replaceItems();

    // Create the network
    const net = new Network(this.$refs.vis, { nodes, edges }, options);
    this.net = net;
    this.cleanUpCallbacks.push(() => {
      net.destroy();
    });

    // Some labels contain placeholders for info from connected nodes.
    // Therefore this can't be done before the topology is built.
    this.updateLabels();

    this.cleanUpCallbacks.push(
      this.$store.subscribe(({ type, payload }, { data }) => {
        (this.storeActions[type] || (() => {}))(payload, data);
      })
    );

    this.$emit("ready", { container, net, nodes, edges });
  },
  beforeDestroy() {
    this.cleanUpCallbacks.forEach((clb) => {
      try {
        clb();
      } catch (error) {
        console.error(error);
      }
    });
  },
  methods: {
    itemToNode(item) {
      return {
        id: item.id,
        group: item.type,
        x: item.x,
        y: item.y,
        label: item.type === "dummy" ? this.processLabel(item) : item.hostname,
        title: generateTooltip(item),
      };
    },
    itemToEdge(item) {
      return {
        id: item.id,
        from: item.from,
        to: item.to,
        label: item.hostname,
        title: generateTooltip(item),
      };
    },
    processLabel(item) {
      if (!this.net) {
        return item.hostname;
      }

      const neighbors = this.net
        .getConnectedNodes(item.id)
        .map((id) => this.data.items[id]);
      return item.hostname.replace(this.labelPlaceholders.re, (match) => {
        return (
          this.labelPlaceholders.replace[match.toUpperCase()] ||
          this.labelPlaceholders.replace.fallback
        )(neighbors, match);
      });
    },
    updateLabels(ids) {
      this.nodes.update(
        (ids || this.nodes.getIds())
          .map((id) => this.data.items[id])
          .filter((item) => item.type === "dummy")
          .map((item) => this.itemToNode(item))
      );
    },
    replaceItems() {
      // Preprocess items
      const items = Object.keys(this.data.items).map((id) => {
        const node = JSON.parse(JSON.stringify(this.data.items[id]));
        node.id = id;
        return node;
      });

      // Nodes
      this.nodes.clear();
      this.nodes.add(
        items.filter(({ type }) => !this.isEdge(type)).map(this.itemToNode)
      );

      // Edges
      this.edges.clear();
      this.edges.add(
        items.filter(({ type }) => this.isEdge(type)).map(this.itemToEdge)
      );

      // Some labels contain placeholders for info from connected nodes.
      // Therefore this can't be done before the topology is built.
      if (this.net) {
        this.updateLabels();
      }
    },
    async toTileBlobs({
      canvasHeight,
      canvasWidth,
      onBlob,
      scale,
      tileHeight,
      tileWidth,
    }) {
      const bb = await this.boundingBox({ scale });

      // Solve rounding issues (usually ±1 px)
      // Ensures that the user gets the size they see
      if (canvasWidth) {
        bb.width = canvasWidth;
      }
      if (canvasHeight) {
        bb.height = canvasHeight;
      }

      // Rendering zero sized images doesn't work nor makes sense
      if (!bb.width || !bb.height) {
        throw new RangeError("Image has to have non-zero size.");
      }

      const beforeDrawingHandler = (ctx) => {
        const { x, y } = this.net.view.targetTranslation;
        const scale = this.net.view.targetScale;
        ctx.fillStyle = "#fff";
        ctx.fillRect(
          -x / scale - 1,
          -y / scale - 1,
          ctx.canvas.width / scale + 2,
          ctx.canvas.height / scale + 2
        );
      };

      this.net.on("beforeDrawing", beforeDrawingHandler);

      try {
        // Compute the number of columns and rows of tiles
        const cols = Math.ceil(bb.width / tileWidth);
        const rows = Math.ceil(bb.height / tileHeight);

        // Offset for Vis coordinates, Vis always points to the center, not topleft corner
        const offset = {
          x: -(bb.sX + tileWidth / 2),
          y: -(bb.sY + tileHeight / 2),
        };

        // Resize the canvas to tile size
        await new Promise((resolve) => {
          const handler = () => {
            this.net.off("resize", handler);
            resolve();
          };

          this.net.on("resize", handler);
          this.width = tileWidth;
          this.height = tileHeight;
        });

        // Apply scale
        this.net.moveTo({
          scale,
          animation: false,
        });

        // Render the tiles
        const totalTiles = rows * cols;
        let doneTiles = 0;
        for (let row = 0; row < rows; ++row) {
          for (let col = 0; col < cols; ++col) {
            // Move the viewport
            this.net.moveTo({
              position: { x: 0, y: 0 },
              offset: {
                x: offset.x - tileWidth * col,
                y: offset.y - tileHeight * row,
              },
              animation: false,
            });

            // Render image blob
            const blob = await new Promise((resolve) => {
              const handler = (ctx) => {
                this.net.off("afterDrawing", handler);
                ctx.canvas.toBlob(resolve, "image/png");
              };

              this.net.on("afterDrawing", handler);
              this.net.redraw();
            });

            // Update progress
            ++doneTiles;

            // Send the tile blob to the caller
            await onBlob(blob, { col, cols, doneTiles, row, rows, totalTiles });
          }
        }
      } finally {
        this.net.off("beforeDrawing", beforeDrawingHandler);
      }
    },
    isEdge(type) {
      return type === "link" || type === "association";
    },
    buildGroupColor({ canvas }, bg = false) {
      const background = bg ? this.theme.background : colors.shades.transparent;
      return {
        background: background,
        border: canvas,
        highlight: {
          background: background,
          border: canvas,
        },
        hover: {
          background: background,
          border: canvas,
        },
      };
    },
  },
};
</script>

<style scoped>
.vis-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.vis-container > * {
  position: absolute;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
}
</style>
