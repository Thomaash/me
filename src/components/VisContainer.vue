<template>
  <div
    ref="root"
    class="component-container position-relative w-100 h-100"
    tabindex="0"
    @mousemove="moveMouseTag"
    @drag="moveMouseTag"
    @mouseover="focusRoot"
    @keydown="keypress"
  >
    <LoadingSpinner v-if="appStore.loading !== false" />
    <template v-else>
      <VisCanvas data-cy="vis" :dark="dark" @ready="init" />

      <div
        v-if="newItem.type != null"
        :style="{ left: mouseTag.x + 'px', top: mouseTag.y + 'px' }"
        class="mouse-tag"
      >
        <v-icon color="black">{{ mouseTagIcon }}</v-icon>
      </div>

      <v-snackbar
        v-model="snackbar.show"
        :data-cy-type="snackbar.type"
        :data-cy-values="JSON.stringify(snackbar.values)"
        data-cy="vis-snackbar"
      >
        {{ snackbarMessage }}
        <v-btn
          color="primary"
          variant="text"
          @click="snackbar.actionFunction()"
        >
          {{ snackbar.actionName }}
        </v-btn>
      </v-snackbar>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { RectangularSelection } from "./vis/RectangularSelection";
import VisCanvas from "./vis/VisCanvas.vue";
import { deselectHandler } from "./vis/deselectHandler";
import { v4 as randomUUID } from "uuid";
import { compareNodes } from "./vis/locale";
import {
  baseHostnames,
  generateOrganizedPortCoors,
  getEdgeType as getEdgeTypeHelper,
  getNextHostname,
  isEdgeValid as isEdgeValidHelper,
  nodePriorities,
  orderNodes as orderNodesHelper,
  portAmounts,
} from "./vis/visContainerHelpers";
import { dark, selection as selectionTheme } from "@/theme";
import { useTopologyStore } from "@/store/topologyStore";
import { useAppStore } from "@/store/appStore";

function delayCall(fn = () => {}, delay = 0) {
  let timeout = null;
  return () => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      fn();
      timeout = null;
    }, delay);
  };
}

const snackbarMsgGenerator = new Map([
  ["undone", () => "Undone."],
  ["redone", () => "Redone."],
  ["nothing-to-undo", () => "Nothing more to undo."],
  ["nothing-to-redo", () => "Nothing more to redo."],
  [
    "items-deleted",
    (count) => `${count} item${count === 1 ? "" : "s"} deleted.`,
  ],
]);

// [ctrl][key]
const keybindings = {
  false: {
    Delete: "deleteSelected",
    Escape: "stopEditMode",
    a: "fitAll",
    c: "addController",
    d: "deleteSelected",
    e: "addEdge",
    f: "fitSelected",
    h: "addHost",
    i: "addIPsDummy",
    l: "addDummy",
    p: "addPort",
    s: "addSwitch",
    t: "addTypesDummy",
    z: "setScale",
  },
  true: {
    a: "selectAll",
    y: "redo",
    z: "undo",
  },
};

const emit = defineEmits(["edit-item"]);
const topologyStore = useTopologyStore();
const appStore = useAppStore();
const route = useRoute();
const router = useRouter();

// Template ref
const root = ref(null);

// Reactive state
const newItem = reactive({
  type: null,
  connectTo: null,
  label: null,
  noEdit: false,
});
newItem.set = function setNewItem(type, connectTo, label, noEdit) {
  newItem.type = type || null;
  newItem.connectTo = connectTo || null;
  newItem.label = label || null;
  newItem.noEdit = noEdit || false;
};

const mouseTag = reactive({
  x: 0,
  y: 0,
});

const snackbar = reactive({
  show: false,
  type: undefined,
  values: undefined,
  actionName: undefined,
  actionFunction: undefined,
});
const snackbarMessage = computed(() => {
  const fn = snackbarMsgGenerator.get(snackbar.type);
  return fn ? fn(...(snackbar.values || [])) : "Unknown message type.";
});

// Non-reactive vis-network instances (must NOT be deeply reactive)
let net = null;
let nodes = null;
let edges = null;

// Computed
const data = topologyStore.data;
const mouseTagIcon = computed(() => "$net-" + newItem.type);

// Methods
function moveMouseTag({ clientX: x, clientY: y }) {
  mouseTag.x = x;
  mouseTag.y = y;
}

function addEdge() {
  newItem.set("edge");
  net.addEdgeMode();
}

function addController() {
  newItem.set("controller");
  net.addNodeMode();
}

function addDummy() {
  newItem.set("dummy");
  net.addNodeMode();
}

function addIPsDummy() {
  newItem.set(
    "dummy",
    ["port", "host", "switch", "controller"],
    "{{IPS}}",
    true,
  );
  net.addNodeMode();
}

function addTypesDummy() {
  newItem.set("dummy", ["switch", "controller"], "{{TYPES}}", true);
  net.addNodeMode();
}

function addHost() {
  newItem.set("host");
  net.addNodeMode();
}

function addPort() {
  newItem.set("port", ["host", "switch"]);
  net.addNodeMode();
}

function addSwitch() {
  newItem.set("switch");
  net.addNodeMode();
}

function commitPositions(ids) {
  const positions = net.getPositions(ids);
  const updateItems = Object.keys(positions).map((id) => ({
    ...positions[id],
    id,
  }));
  topologyStore.updateItems(updateItems);
}

function commitUncommitedPositions() {
  const updated = nodes
    .get()
    .filter(({ x, y }) => x == null || y == null)
    .map(({ id }) => id);
  if (updated.length) {
    commitPositions(updated);
  }
}

function showSnackbar(
  type,
  values = [],
  actionName = "Close",
  actionFunction = () => {
    snackbar.show = false;
  },
) {
  snackbar.type = type;
  snackbar.values = values;
  snackbar.actionName = actionName;
  snackbar.actionFunction = actionFunction;

  snackbar.show = false;
  window.setTimeout(() => {
    snackbar.show = true;
  });
}

function deleteSelected() {
  const selection = net.getSelection();
  const count = selection.nodes.length + selection.edges.length;

  if (count) {
    topologyStore.removeItems([...selection.nodes, ...selection.edges]);

    showSnackbar("items-deleted", [count], "Undo", undo);
    updateURL();
  }
}

function selectAll() {
  net.setSelection({
    nodes: nodes.getIds(),
    edges: edges.getIds(),
  });
  updateURL();
}

function fitAll() {
  net.fit({ animation: true });
  clearURLPosition();
}

function fitSelected(animate = true) {
  net.fit({
    nodes: net.getSelectedNodes(),
    animation: animate,
  });
  clearURLPosition();
}

function setScale(scale) {
  net.moveTo({
    scale: scale != null ? scale : 1,
    animation: true,
  });
  updateURL();
}

function undo() {
  try {
    topologyStore.undo();
    showSnackbar("undone");
  } catch {
    showSnackbar("nothing-to-undo");
  }
}

function redo() {
  try {
    topologyStore.redo();
    showSnackbar("redone");
  } catch {
    showSnackbar("nothing-to-redo");
  }
}

function stopEditMode() {
  newItem.set();
  net.disableEditMode();
}

async function editItem(node, commit) {
  const oldItem = data.items[node.id] || {
    id: node.id,
    type: node.group,
    hostname: node.label,
  };

  const item = await new Promise((resolve) => {
    emit("edit-item", oldItem, resolve);
  });
  // Ensure the root is focused (there were issues with broken keybindings).
  focusRoot();

  if (!item) {
    // Node/edge adding mode is not turned off unless a node/edge is placed.
    stopEditMode();
    return {};
  }

  if (node.from && node.to) {
    item.from = node.from;
    item.to = node.to;
  }

  if (commit !== false) {
    topologyStore.replaceItems([item]);
  }

  return { node, item };
}

function orderNodes(edge) {
  return orderNodesHelper(edge, data.items);
}

function getEdgeType(edge) {
  return getEdgeTypeHelper(edge, data.items);
}

function isEdgeValid(edge, type) {
  return isEdgeValidHelper(edge, type, data.items);
}

function getConnectedNodes(id, type) {
  return net
    .getConnectedNodes(id)
    .map((id) => nodes.get(id))
    .filter((node) => node.group === type);
}

function organizePorts(node) {
  const ports = getConnectedNodes(node.id, "port").toSorted(compareNodes);
  const coords = generateOrganizedPortCoors(
    net.getPositions([node.id])[node.id],
    ports.length,
  );

  topologyStore.updateItems(
    coords.map((coords, i) => ({
      ...coords,
      id: ports[i].id,
    })),
  );
}

function getNextFreeHostname(type, rootNodeId) {
  if (type === "port") {
    // Local namespace
    if (rootNodeId == null) {
      return baseHostnames[type];
    }

    return getNextHostname(
      getConnectedNodes(rootNodeId, type).map(
        ({ id }) => data.items[id].hostname,
      ),
      baseHostnames[type],
    );
  } else {
    // Global namespace
    return getNextHostname(
      nodes
        .get()
        .filter((node) => node.group === type)
        .map(({ id }) => data.items[id].hostname),
      baseHostnames[type],
    );
  }
}

function getClosestId(x, y, types, maxDistance) {
  const ids = nodes
    .getIds()
    .filter((id) => types.indexOf(data.items[id].type) !== -1);
  const positions = net.getPositions(ids);
  const distances = ids.map((id) =>
    Math.hypot(positions[id].x - x, positions[id].y - y),
  );
  const closestIndex = distances.reduce(
    (acc, val, i) => (val < distances[acc] ? i : acc),
    0,
  );

  return distances[closestIndex] <= maxDistance ? ids[closestIndex] : null;
}

function focusRoot() {
  root.value.focus();
}

const keybindingActions = {
  deleteSelected,
  stopEditMode,
  fitAll,
  addController,
  addEdge,
  fitSelected,
  addHost,
  addIPsDummy,
  addDummy,
  addPort,
  addSwitch,
  addTypesDummy,
  setScale,
  selectAll,
  redo,
  undo,
};

function keypress(event) {
  const attr = keybindings[event.ctrlKey][event.key];
  if (attr) {
    event.preventDefault();
    keybindingActions[attr]();
  }
}

async function routerPush(...args) {
  try {
    return await router.push(...args);
  } catch (error) {
    if (error.name === "NavigationDuplicated") {
      // We're already where we want to be so no problem.
    } else {
      throw error;
    }
  }
}

function clearURLPosition() {
  return routerPush({
    name: "Canvas without position",
    params: {
      ids: route.params.ids,
    },
  });
}

function updateURL() {
  const { x, y } = net.getViewPosition();
  const scale = net.getScale();
  const selection = net.getSelection();

  return routerPush({
    name: "Canvas with position",
    params: {
      ids: [...selection.nodes, ...selection.edges].join(","),
      x: Math.round(x),
      y: Math.round(y),
      scale: Math.round(scale * 1000) / 1000 || 0.001,
    },
  });
}

function applyURL() {
  const { ids, x, y, scale } = route.params;

  if (ids) {
    const idsArray = ids.split(",");
    net.setSelection({
      nodes: idsArray.filter((id) => nodes.get(id)),
      edges: idsArray.filter((id) => edges.get(id)),
    });
  }

  if (x != null && y != null && scale != null) {
    net.moveTo({
      position: { x: +x, y: +y },
      scale: +scale,
    });
  } else {
    fitSelected(false);
  }
}

function init({
  container,
  net: netInstance,
  nodes: nodesInstance,
  edges: edgesInstance,
}) {
  net = netInstance;
  nodes = nodesInstance;
  edges = edgesInstance;

  // Save new positions if any missing
  commitUncommitedPositions();

  // Manipulation
  net.setOptions({
    manipulation: {
      enabled: false,
      addNode: async (node, callback) => {
        callback(); // Node will be added via reactivity from Vuex

        const newItemSnapshot = { ...newItem };
        newItem.set();

        node.group = newItemSnapshot.type;
        node.label = newItemSnapshot.label;

        const closestId = newItemSnapshot.connectTo
          ? getClosestId(node.x, node.y, newItemSnapshot.connectTo, 500)
          : null;
        node.label =
          newItemSnapshot.label ||
          (baseHostnames[node.group]
            ? getNextFreeHostname(node.group, closestId)
            : "");

        const { node: edited, item } = newItemSnapshot.noEdit
          ? {
              node,
              item: {
                id: node.id,
                type: node.group,
                hostname: node.label,
              },
            }
          : await editItem(node, false);
        if (!edited) {
          return;
        }

        item.x = edited.x;
        item.y = edited.y;
        const items = [item];

        if (closestId != null) {
          const association = {
            id: randomUUID(),
          };

          if (
            nodePriorities.indexOf(item.type) >
            nodePriorities.indexOf(data.items[closestId].type)
          ) {
            association.from = closestId;
            association.to = edited.id;
          } else {
            association.from = edited.id;
            association.to = closestId;
          }

          items.push({
            id: association.id,
            type: "association",
            from: association.from,
            to: association.to,
          });
        }

        const portCount = portAmounts[edited.group] || 0;
        if (portCount > 0) {
          const coords = generateOrganizedPortCoors(edited, portCount);
          for (let i = 0; i < portCount; ++i) {
            const port = {
              id: randomUUID(),
              label: `eth${i}`,
              group: "port",
              ...coords[i],
            };
            items.push({
              id: port.id,
              hostname: port.label,
              type: "port",
              ...coords[i],
            });

            const edge = {
              id: randomUUID(),
              from: edited.id,
              to: port.id,
            };
            items.push({
              id: edge.id,
              type: "association",
              from: edge.from,
              to: edge.to,
            });
          }
        }

        topologyStore.replaceItems(items);
      },
      editNode: async (node, callback) => {
        newItem.set();
        await editItem(node);
        callback();
      },
      addEdge: async (edge, callback) => {
        callback(); // Edge will be added via reactivity from Vuex

        orderNodes(edge);
        const type = getEdgeType(edge);
        if (isEdgeValid(edge, type)) {
          edge.id = edge.id || randomUUID();
          edge.group = type;
          edge.label = "";

          await editItem(edge);
        }

        newItem.set();
      },
      editEdge: async (edge, callback) => {
        orderNodes(edge);
        if (isEdgeValid(edge, getEdgeType(edge))) {
          await editItem(edge);
          callback();
        } else {
          callback();
        }

        newItem.set();
      },
    },
  });

  // Events
  net.on("deselectNode", deselectHandler.bind(null, net));
  net.on("deselectEdge", deselectHandler.bind(null, net));
  net.on("doubleClick", async (event) => {
    if (event.nodes.length === 0 && event.edges.length === 1) {
      const id = event.edges[0];
      await editItem(edges.get(id));
    } else if (event.nodes.length === 1) {
      net.editNode();
    }
  });
  net.on("hold", (event) => {
    if (event.nodes.length === 0 && event.edges.length === 1) {
      net.editEdgeMode();
    } else if (event.nodes.length === 1) {
      const node = nodes.get(event.nodes[0]);
      if (node.group === "host" || node.group === "switch") {
        organizePorts(node);
      }
    }
  });
  net.on("dragEnd", (event) => {
    if (event.nodes.length > 0) {
      commitPositions(event.nodes);
    }
  });
  net.on("dragStart", (event) => {
    if (event.nodes.length !== 1) {
      return;
    }
    const nodeItem = data.items[event.nodes[0]];
    if (!(nodeItem.type === "host" || nodeItem.type === "switch")) {
      return;
    }

    const toSelect = new Set();
    net.getSelectedEdges().forEach((edgeId) => {
      const edge = edges.get(edgeId);
      toSelect.add(edge.to);
      toSelect.add(edge.from);
    });
    const toSelectFiltered = [...toSelect].filter(
      (nodeId) => data.items[nodeId].type === "port",
    );
    if (toSelectFiltered.length) {
      net.selectNodes([event.nodes[0], ...toSelectFiltered]);
    }
  });

  // URL changing events
  net.on("dragEnd", delayCall(updateURL));
  net.on("select", delayCall(updateURL));
  net.on("zoom", delayCall(updateURL, 200));

  // Focus items
  applyURL();

  // Set rectangular selection up
  const rs = new RectangularSelection(container, net, nodes, selectionTheme);
  rs.attach();
}

// Lifecycle
onMounted(() => {
  focusRoot();
});

// Expose only the parent-facing commands consumed by CanvasPage.
defineExpose({
  addEdge,
  addPort,
  addHost,
  addSwitch,
  addController,
  addDummy,
  deleteSelected,
});
</script>

<style scoped>
.mouse-tag {
  position: fixed;
  margin: 1em;
}
</style>

<style>
.vis-tooltip {
  background: rgba(255, 255, 255, 0.9);
  border: grey 1px solid;
  padding: 1ex;
  position: absolute;
  white-space: nowrap;
}
.vis-tooltip td {
  padding-left: 1ex;
}
.vis-tooltip td:first-child {
  padding-left: unset;
}

.component-container {
  outline: none;
}
.component-container * {
  outline: none;
}
</style>
