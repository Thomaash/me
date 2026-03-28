<template>
  <div
    ref="container"
    :style="{ width: widthStyle, height: heightStyle }"
    class="vis-container"
  >
    <div ref="vis" class="vis-root" />
  </div>
</template>

<script setup>
defineOptions({ name: "VisCanvas" });

import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import {
  isEdge,
  buildGroupColor,
  itemToNode as itemToNodeUtil,
  itemToEdge as itemToEdgeUtil,
  processLabel as processLabelUtil,
} from "./visCanvasUtils";
import { DataSet } from "vis-data/peer";
import { Network } from "vis-network/peer";
import { canvasDark, canvasLight, itemsDark, itemsLight } from "@/theme";

import "vis-network/styles/vis-network.css";

import controllerImgDark from "@/assets/network/controller.dark.svg";
import controllerImgLight from "@/assets/network/controller.light.svg";
import hostImgDark from "@/assets/network/host.dark.svg";
import hostImgLight from "@/assets/network/host.light.svg";
import portImgDark from "@/assets/network/port.dark.svg";
import portImgLight from "@/assets/network/port.light.svg";
import switchImgDark from "@/assets/network/switch.dark.svg";
import switchImgLight from "@/assets/network/switch.light.svg";

const props = defineProps({
  dark: {
    required: true,
    type: Boolean,
  },
});

const emit = defineEmits(["ready"]);

const store = useStore();

// Template refs
const container = ref(null);
const vis = ref(null);

// Reactive state
const width = ref(null);
const height = ref(null);
const cleanUpCallbacks = ref([]);

// Non-reactive vis-network instances (must NOT be deeply reactive)
let net = null;
let nodes = null;
let edges = null;

// Store getters
const data = computed(() => store.getters["topology/data"]);
const boundingBox = computed(() => store.getters["topology/boundingBox"]);

// Computed
const theme = computed(() => ({
  images: {
    controller: props.dark ? controllerImgDark : controllerImgLight,
    host: props.dark ? hostImgDark : hostImgLight,
    port: props.dark ? portImgDark : portImgLight,
    switch: props.dark ? switchImgDark : switchImgLight,
  },
  items: {
    controller: props.dark ? itemsDark.controller : itemsLight.controller,
    dummy: props.dark ? itemsDark.dummy : itemsLight.dummy,
    host: props.dark ? itemsDark.host : itemsLight.host,
    port: props.dark ? itemsDark.port : itemsLight.port,
    switch: props.dark ? itemsDark.switch : itemsLight.switch,
  },
  foreground: props.dark ? canvasDark.foreground : canvasLight.foreground,
  background: props.dark ? canvasDark.background : canvasLight.background,
}));

const options = computed(() => ({
  physics: {
    enabled: false,
  },
  nodes: {
    // Invisible border, 0 makes selected border disappear
    borderWidth: 0.0001,
    borderWidthSelected: 2,
    font: {
      align: "center",
      color: theme.value.foreground,
      face: "Source Sans 3",
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
      color: theme.value.foreground,
      face: "Source Sans 3",
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
      color: buildGroupColor(
        theme.value.items.controller,
        false,
        theme.value.background,
      ),
      size: 25,
      image: theme.value.images.controller,
    },
    dummy: {
      shape: "box",
      color: buildGroupColor(
        theme.value.items.dummy,
        true,
        theme.value.background,
      ),
      font: {
        color: theme.value.foreground,
        face: "Source Code Pro",
        align: "left",
      },
      borderWidth: 1,
    },
    host: {
      shape: "image",
      color: buildGroupColor(
        theme.value.items.host,
        false,
        theme.value.background,
      ),
      size: 25,
      image: theme.value.images.host,
    },
    port: {
      shape: "image",
      color: buildGroupColor(
        theme.value.items.port,
        false,
        theme.value.background,
      ),
      size: 10,
      image: theme.value.images.port,
    },
    switch: {
      shape: "image",
      color: buildGroupColor(
        theme.value.items.switch,
        false,
        theme.value.background,
      ),
      size: 25,
      image: theme.value.images.switch,
    },
  },
}));

const widthStyle = computed(() =>
  width.value == null ? undefined : `${width.value}px`,
);

const heightStyle = computed(() =>
  height.value == null ? undefined : `${height.value}px`,
);

// Helper functions (not exposed)
function toNode(item) {
  return itemToNodeUtil(item, (i) => doProcessLabel(i));
}

function toEdge(item) {
  return itemToEdgeUtil(item);
}

function doProcessLabel(item) {
  return processLabelUtil(item, net, data.value.items);
}

// Build the exposed object. This SAME object is passed to defineExpose AND used
// for internal method dispatch. vi.spyOn(vm, 'method') uses Object.defineProperty
// on this object (through Vue's proxy chain), so internal calls via
// exposedApi.method() are intercepted by test spies.
const exposedApi = {
  // Refs auto-unwrap through proxyRefs in Vue's expose proxy
  cleanUpCallbacks,
  theme,
  options,
  widthStyle,
  heightStyle,
  width,
  height,

  updateLabels(ids) {
    nodes.update(
      (ids || nodes.getIds())
        .map((id) => data.value.items[id])
        .filter((item) => item.type === "dummy")
        .map((item) => toNode(item)),
    );
  },

  replaceItems() {
    // Preprocess items
    const items = Object.keys(data.value.items).map((id) => {
      const node = JSON.parse(JSON.stringify(data.value.items[id]));
      node.id = id;
      return node;
    });

    // Nodes
    nodes.clear();
    nodes.add(items.filter(({ type }) => !isEdge(type)).map(toNode));

    // Edges
    edges.clear();
    edges.add(items.filter(({ type }) => isEdge(type)).map(toEdge));

    // Some labels contain placeholders for info from connected nodes.
    // Therefore this can't be done before the topology is built.
    if (net) {
      exposedApi.updateLabels();
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
    const bb = await boundingBox.value({ scale });

    // Solve rounding issues (usually +/-1 px)
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
      const { x, y } = net.view.targetTranslation;
      const netScale = net.view.targetScale;
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        -x / netScale - 1,
        -y / netScale - 1,
        ctx.canvas.width / netScale + 2,
        ctx.canvas.height / netScale + 2,
      );
    };

    net.on("beforeDrawing", beforeDrawingHandler);

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
          net.off("resize", handler);
          resolve();
        };

        net.on("resize", handler);
        width.value = tileWidth;
        height.value = tileHeight;
      });

      // Apply scale
      net.moveTo({
        scale,
        animation: false,
      });

      // Render the tiles
      const totalTiles = rows * cols;
      let doneTiles = 0;
      for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
          // Move the viewport
          net.moveTo({
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
              net.off("afterDrawing", handler);
              ctx.canvas.toBlob(resolve, "image/png");
            };

            net.on("afterDrawing", handler);
            net.redraw();
          });

          // Update progress
          ++doneTiles;

          // Send the tile blob to the caller
          await onBlob(blob, { col, cols, doneTiles, row, rows, totalTiles });
        }
      }
    } finally {
      net.off("beforeDrawing", beforeDrawingHandler);
    }
  },
};

// Add storeActions after exposedApi is defined (references exposedApi methods)
const storeActions = computed(() => ({
  "topology/importData": () => {
    exposedApi.replaceItems();
  },
  "topology/applyChange": ({ remove, update, replace }) => {
    const ids = [
      ...(remove || []),
      ...[...(update || []), ...(replace || [])].map((item) => item.id),
    ];
    const nodeItems = [];
    const edgeItems = [];

    // Save old neighbors for label update
    const updatedIds = new Set(
      [].concat(...ids, ...ids.map((id) => net.getConnectedNodes(id))),
    );

    if (update) {
      Object.values(update).forEach((itemUpdate) => {
        const item = {
          ...data.value.items[itemUpdate.id],
          ...itemUpdate,
        };

        if (isEdge(item.type)) {
          edgeItems.push(toEdge(item));
        } else {
          nodeItems.push(toNode(item));
        }
      });
    }

    if (replace) {
      Object.values(replace).forEach((item) => {
        if (isEdge(item.type)) {
          edgeItems.push(toEdge(item));
        } else {
          nodeItems.push(toNode(item));
        }
      });
    }

    // Update Vis
    if (ids.length) {
      nodes.remove(ids);
      edges.remove(ids);
    }
    if (nodeItems.length) {
      nodes.add(nodeItems);
    }
    if (edgeItems.length) {
      edges.add(edgeItems);
    }

    // Save new neighbors for label update
    ids.forEach((id) =>
      net.getConnectedNodes(id).forEach((id) => updatedIds.add(id)),
    );

    // Update label texts
    exposedApi.updateLabels(
      [...updatedIds].filter((id) => data.value.items[id]),
    );
  },
}));

// Add storeActions and non-reactive getters to the exposed API
exposedApi.storeActions = storeActions;
Object.defineProperty(exposedApi, "net", {
  get: () => net,
  enumerable: true,
  configurable: true,
});
Object.defineProperty(exposedApi, "nodes", {
  get: () => nodes,
  enumerable: true,
  configurable: true,
});
Object.defineProperty(exposedApi, "edges", {
  get: () => edges,
  enumerable: true,
  configurable: true,
});

// Watch options changes
watch(options, (v) => {
  net.setOptions(v);
});

// Lifecycle
onMounted(() => {
  const containerEl = container.value;
  const opts = options.value;

  // Create and fill datasets
  nodes = new DataSet();
  edges = new DataSet();
  // It's necessary to load the items now, otherwise the network would be labeled as ready before the items are visible.
  exposedApi.replaceItems();

  // Create the network
  net = new Network(vis.value, { nodes, edges }, opts);
  cleanUpCallbacks.value.push(() => {
    net.destroy();
  });

  // Some labels contain placeholders for info from connected nodes.
  // Therefore this can't be done before the topology is built.
  exposedApi.updateLabels();

  cleanUpCallbacks.value.push(
    store.subscribe(({ type, payload }) => {
      (storeActions.value[type] || (() => {}))(payload);
    }),
  );

  emit("ready", { container: containerEl, net, nodes, edges });
});

onBeforeUnmount(() => {
  cleanUpCallbacks.value.forEach((clb) => {
    try {
      clb();
    } catch (error) {
      console.error(error);
    }
  });
});

defineExpose(exposedApi);
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
