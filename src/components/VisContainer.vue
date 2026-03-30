<template>
  <div
    ref="root"
    class="component-container"
    tabindex="0"
    @mousemove="moveMouseTag"
    @drag="moveMouseTag"
    @mouseover="focusRoot"
    @keydown="keypress"
  >
    <LoadingSpinner v-if="loading !== false" />
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
import RectangularSelection from "./vis/RectangularSelection";
import VisCanvas from "./vis/VisCanvas.vue";
import deselectHandler from "./vis/deselectHandler";
import { v4 as randomUUID } from "uuid";
import { compare, compareNodes } from "./vis/locale";
import { dark, selection as selectionTheme } from "@/theme";
import { useTopologyStore } from "@/composables/useTopologyStore";

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

const portAmounts = {
  host: 2,
  switch: 6,
};
const nodePriorities = ["dummy", "controller", "switch", "host", "port"];
const edgeTests = {
  link: (src, dst) => src === "port" && dst === "port",
  association: (src, dst) =>
    (src === "controller" && dst === "switch") ||
    (src === "switch" && dst === "port") ||
    (src === "host" && dst === "port") ||
    src === "dummy",
};
const baseHostnames = {
  controller: "c1",
  host: "h1",
  port: "eth0",
  switch: "s1",
};

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
const {
  data: topoData,
  loading,
  dispatch: topologyDispatch,
} = useTopologyStore();
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
const data = topoData;
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

function commitToStore(type, payload) {
  topologyDispatch(type, payload);
}

function commitPositions(ids) {
  const positions = net.getPositions(ids);
  const updateItems = Object.keys(positions).map((id) => ({
    ...positions[id],
    id,
  }));
  commitToStore("updateItems", updateItems);
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
    commitToStore("removeItems", [...selection.nodes, ...selection.edges]);

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
    commitToStore("undo");
    showSnackbar("undone");
  } catch {
    showSnackbar("nothing-to-undo");
  }
}

function redo() {
  try {
    commitToStore("redo");
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
  const oldItem = data.value.items[node.id] || {
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
    commitToStore("replaceItems", [item]);
  }

  return { node, item };
}

function orderNodes(edge) {
  const src = data.value.items[edge.from].type;
  const dst = data.value.items[edge.to].type;
  if (nodePriorities.indexOf(src) > nodePriorities.indexOf(dst)) {
    const tmp = edge.from;
    edge.from = edge.to;
    edge.to = tmp;
  }
}

function getEdgeType(edge) {
  const item = data.value.items[edge.id];
  if (item && item.type) {
    return item.type;
  }

  const src = data.value.items[edge.from].type;
  const dst = data.value.items[edge.to].type;
  if (src === "port" && dst === "port") {
    return "link";
  } else {
    return "association";
  }
}

function isEdgeValid(edge, type) {
  const src = data.value.items[edge.from].type;
  const dst = data.value.items[edge.to].type;
  return edgeTests[type](src, dst);
}

function generateOrganizedPortCoors({ x, y }, ports) {
  const xOffset = ports <= 8 ? 50 : 30;
  const yEvenOffset = ports <= 8 ? 0 : 25;
  const portY = y + 70;
  const firstX = x - ((ports - 1) * xOffset) / 2;

  return [...Array(ports)].map((_v, i) => ({
    x: firstX + xOffset * i,
    y: portY + (i % 2 === 0 ? yEvenOffset : 0),
  }));
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

  commitToStore(
    "updateItems",
    coords.map((coords, i) => ({
      ...coords,
      id: ports[i].id,
    })),
  );
}

function getNextHostname(hostnames, fallback) {
  if (!hostnames.length) {
    return fallback;
  }

  const prevHostname = hostnames.toSorted(compare)[hostnames.length - 1];
  const res = /^(.*?)(\d+)([^\d]*?)$/.exec(prevHostname);
  if (res == null) {
    return fallback;
  }

  const [, pre, nm, post] = res;
  const nextLabel = `${pre}${+nm + 1}${post}`;
  return nextLabel;
}

function getNextFreeHostname(type, rootNodeId) {
  if (type === "port") {
    // Local namespace
    if (rootNodeId == null) {
      return baseHostnames[type];
    }

    return getNextHostname(
      getConnectedNodes(rootNodeId, type).map(
        ({ id }) => data.value.items[id].hostname,
      ),
      baseHostnames[type],
    );
  } else {
    // Global namespace
    return getNextHostname(
      nodes
        .get()
        .filter((node) => node.group === type)
        .map(({ id }) => data.value.items[id].hostname),
      baseHostnames[type],
    );
  }
}

function getClosestId(x, y, types, maxDistance) {
  const ids = nodes
    .getIds()
    .filter((id) => types.indexOf(data.value.items[id].type) !== -1);
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
            nodePriorities.indexOf(data.value.items[closestId].type)
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

        commitToStore("replaceItems", items);
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
    const nodeItem = data.value.items[event.nodes[0]];
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
      (nodeId) => data.value.items[nodeId].type === "port",
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

// Expose for parent (CanvasPage) and tests
defineExpose({
  // Reactive state
  newItem,
  mouseTag,
  snackbar,
  // Computed
  snackbarMessage,
  mouseTagIcon,
  // Non-reactive vis instances (assigned in init)
  get net() {
    return net;
  },
  set net(v) {
    net = v;
  },
  get nodes() {
    return nodes;
  },
  set nodes(v) {
    nodes = v;
  },
  get edges() {
    return edges;
  },
  set edges(v) {
    edges = v;
  },
  // Methods
  moveMouseTag,
  keypress,
  addEdge,
  addController,
  addDummy,
  addIPsDummy,
  addTypesDummy,
  addHost,
  addPort,
  addSwitch,
  deleteSelected,
  selectAll,
  fitAll,
  fitSelected,
  setScale,
  undo,
  redo,
  showSnackbar,
  stopEditMode,
  editItem,
  commit: commitToStore,
  commitPositions,
  commitUncommitedPositions,
  orderNodes,
  getEdgeType,
  isEdgeValid,
  generateOrganizedPortCoors,
  getConnectedNodes,
  organizePorts,
  getNextHostname,
  getNextFreeHostname,
  getClosestId,
  focusRoot,
  routerPush,
  clearURLPosition,
  updateURL,
  applyURL,
  init,
});
</script>

<style scoped>
.component-container {
  position: relative;
  width: 100%;
  height: 100%;
}

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
