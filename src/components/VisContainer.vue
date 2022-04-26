<template>
  <div
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
        v-if="newItem.type !== ''"
        :style="{ left: mouseTag.x + 'px', top: mouseTag.y + 'px' }"
        class="mouse-tag"
      >
        <v-icon color="black" v-text="mouseTagIcon" />
      </div>

      <v-snackbar
        v-model="snackbar.show"
        :data-cy-type="snackbar.type"
        :data-cy-values="JSON.stringify(snackbar.values)"
        data-cy="vis-snackbar"
      >
        {{ snackbar.message }}
        <v-btn color="primary" text @click="snackbar.actionFunction()">
          {{ snackbar.actionName }}
        </v-btn>
      </v-snackbar>
    </template>
  </div>
</template>

<script>
import LoadingSpinner from "@/components/LoadingSpinner";
import RectangularSelection from "./vis/RectangularSelection";
import VisCanvas from "./vis/VisCanvas";
import deselectHandler from "./vis/deselectHandler";
import { v4 as randomUUID } from "uuid";
import { compare, compareNodes } from "./vis/locale";
import { mapGetters } from "vuex";
import { dark, selection as selectionTheme } from "@/theme";

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

export default {
  name: "VisContainer",
  components: { LoadingSpinner, VisCanvas },
  data: () => ({
    dark,
    newItem: {
      type: null,
      connectTo: null,
      label: null,
      noEdit: false,
      set(type, connectTo, label, noEdit) {
        this.type = type || null;
        this.connectTo = connectTo || null;
        this.label = label || null;
        this.noEdit = noEdit || false;
      },
    },
    mouseTag: {
      x: 0,
      y: 0,
    },
    snackbar: {
      show: false,
      type: undefined,
      values: undefined,
      actionName: undefined,
      actionFunction: undefined,
      get message() {
        const fn = snackbarMsgGenerator.get(this.type);
        if (fn) {
          return fn(...this.values);
        } else {
          return "Unknown message type.";
        }
      },
    },
  }),
  computed: {
    ...mapGetters("topology", ["data"]),
    loading() {
      return this.$store.state.loading;
    },
    mouseTagIcon() {
      return "$vuetify.icons.net-" + this.newItem.type;
    },
  },
  mounted() {
    this.focusRoot();
  },
  methods: {
    moveMouseTag({ clientX: x, clientY: y }) {
      this.mouseTag.x = x;
      this.mouseTag.y = y;
    },
    addEdge() {
      this.newItem.set("edge");
      this.net.addEdgeMode();
    },
    addController() {
      this.newItem.set("controller");
      this.net.addNodeMode();
    },
    addDummy() {
      this.newItem.set("dummy");
      this.net.addNodeMode();
    },
    addIPsDummy() {
      this.newItem.set(
        "dummy",
        ["port", "host", "switch", "controller"],
        "{{IPS}}",
        true
      );
      this.net.addNodeMode();
    },
    addTypesDummy() {
      this.newItem.set("dummy", ["switch", "controller"], "{{TYPES}}", true);
      this.net.addNodeMode();
    },
    addHost() {
      this.newItem.set("host");
      this.net.addNodeMode();
    },
    addPort() {
      this.newItem.set("port", ["host", "switch"]);
      this.net.addNodeMode();
    },
    addSwitch() {
      this.newItem.set("switch");
      this.net.addNodeMode();
    },
    deleteSelected() {
      const { nodes, edges } = this.net.getSelection();
      const count = nodes.length + edges.length;

      if (count) {
        this.commit("removeItems", [...nodes, ...edges]);

        this.showSnackbar("items-deleted", [count], "Undo", this.undo);
        this.updateURLSelection();
      }
    },
    selectAll() {
      this.net.setSelection({
        nodes: this.nodes.getIds(),
        edges: this.edges.getIds(),
      });
      this.updateURLPosition();
      this.updateURLSelection();
    },
    fitAll() {
      this.net.fit({ animation: true });
      this.clearURLPosition();
    },
    fitSelected(animate = true) {
      this.net.fit({
        nodes: this.net.getSelectedNodes(),
        animation: animate,
      });
      this.clearURLPosition();
    },
    setScale(scale) {
      this.net.moveTo({
        scale: scale != null ? scale : 1,
        animation: true,
      });
      this.updateURLPosition();
    },
    undo() {
      try {
        this.commit("undo");
        this.showSnackbar("undone");
      } catch (error) {
        this.showSnackbar("nothing-to-undo");
      }
    },
    redo() {
      try {
        this.commit("redo");
        this.showSnackbar("redone");
      } catch (error) {
        this.showSnackbar("nothing-to-redo");
      }
    },
    showSnackbar(
      type,
      values = [],
      actionName = "Close",
      actionFunction = () => {
        this.snackbar.show = false;
      }
    ) {
      this.snackbar.type = type;
      this.snackbar.values = values;
      this.snackbar.actionName = actionName;
      this.snackbar.actionFunction = actionFunction;

      this.snackbar.show = false;
      window.setTimeout(() => {
        this.snackbar.show = true;
      });
    },
    stopEditMode() {
      this.newItem.set();
      this.net.disableEditMode();
    },
    async editItem(node, commit) {
      const oldItem = this.data.items[node.id] || {
        id: node.id,
        type: node.group,
        hostname: node.label,
      };

      const item = await new Promise((resolve) => {
        this.$emit("edit-item", oldItem, resolve);
      });
      // Ensure the root is focused (there were issues with broken keybindings).
      this.focusRoot();

      if (!item) {
        // Node/edge adding mode is not turned off unless a node/edge is placed.
        this.stopEditMode();
        return {};
      }

      if (node.from && node.to) {
        item.from = node.from;
        item.to = node.to;
      }

      if (commit !== false) {
        this.commit("replaceItems", [item]);
      }

      return { node, item };
    },
    commit(type, payload) {
      this.$store.dispatch(`topology/${type}`, payload);
    },
    commitPositions(ids) {
      const positions = this.net.getPositions(ids);
      const updateItems = Object.keys(positions).map((id) => ({
        ...positions[id],
        id,
      }));
      this.commit("updateItems", updateItems);
    },
    commitUncommitedPositions() {
      const updated = this.nodes
        .get()
        .filter(({ x, y }) => x == null || y == null)
        .map(({ id }) => id);
      if (updated.length) {
        this.commitPositions(updated);
      }
    },
    orderNodes(edge) {
      const src = this.data.items[edge.from].type;
      const dst = this.data.items[edge.to].type;
      if (nodePriorities.indexOf(src) > nodePriorities.indexOf(dst)) {
        const tmp = edge.from;
        edge.from = edge.to;
        edge.to = tmp;
      }
    },
    getEdgeType(edge) {
      const item = this.data.items[edge.id];
      if (item && item.type) {
        return item.type;
      }

      const src = this.data.items[edge.from].type;
      const dst = this.data.items[edge.to].type;
      if (src === "port" && dst === "port") {
        return "link";
      } else {
        return "association";
      }
    },
    isEdgeValid(edge, type) {
      const src = this.data.items[edge.from].type;
      const dst = this.data.items[edge.to].type;
      return edgeTests[type](src, dst);
    },
    generateOrganizedPortCoors({ x, y }, ports) {
      const xOffset = ports <= 8 ? 50 : 30;
      const yEvenOffset = ports <= 8 ? 0 : 25;
      const portY = y + 70;
      const firstX = x - ((ports - 1) * xOffset) / 2;

      return [...Array(ports)].map((_v, i) => ({
        x: firstX + xOffset * i,
        y: portY + (i % 2 === 0 ? yEvenOffset : 0),
      }));
    },
    getConnectedNodes(id, type) {
      return this.net
        .getConnectedNodes(id)
        .map((id) => this.nodes.get(id))
        .filter((node) => node.group === type);
    },
    organizePorts(node) {
      const ports = this.getConnectedNodes(node.id, "port").sort(compareNodes);
      const coords = this.generateOrganizedPortCoors(
        this.net.getPositions([node.id])[node.id],
        ports.length
      );

      this.commit(
        "updateItems",
        coords.map((coords, i) => ({
          ...coords,
          id: ports[i].id,
        }))
      );
    },
    getNextHostname(hostnames, fallback) {
      if (!hostnames.length) {
        return fallback;
      }

      const prevHostname = hostnames.sort(compare)[hostnames.length - 1];
      const res = /^(.*?)(\d+)([^\d]*?)$/.exec(prevHostname);
      if (res == null) {
        return fallback;
      }

      const [, pre, nm, post] = res;
      const nextLabel = `${pre}${+nm + 1}${post}`;
      return nextLabel;
    },
    getNextFreeHostname(type, rootNodeId) {
      if (type === "port") {
        // Local namespace
        if (rootNodeId == null) {
          return baseHostnames[type];
        }

        return this.getNextHostname(
          this.getConnectedNodes(rootNodeId, type).map(
            ({ id }) => this.data.items[id].hostname
          ),
          baseHostnames[type]
        );
      } else {
        // Global namespace
        return this.getNextHostname(
          this.nodes
            .get()
            .filter((node) => node.group === type)
            .map(({ id }) => this.data.items[id].hostname),
          baseHostnames[type]
        );
      }
    },
    getClosestId(x, y, types, maxDistance) {
      const ids = this.nodes
        .getIds()
        .filter((id) => types.indexOf(this.data.items[id].type) !== -1);
      const positions = this.net.getPositions(ids);
      const distances = ids.map((id) =>
        Math.hypot(positions[id].x - x, positions[id].y - y)
      );
      const closestIndex = distances.reduce(
        (acc, val, i) => (val < distances[acc] ? i : acc),
        0
      );

      return distances[closestIndex] <= maxDistance ? ids[closestIndex] : null;
    },
    focusRoot() {
      this.$el.focus();
    },
    keypress(event) {
      const attr = keybindings[event.ctrlKey][event.key];
      if (attr) {
        event.preventDefault();
        this[attr]();
      }
    },
    async routerPush(...args) {
      try {
        return await this.$router.push(...args);
      } catch (error) {
        if (error.name === "NavigationDuplicated") {
          // We're already where we want to be so no problem.
        } else {
          throw error;
        }
      }
    },
    clearURLPosition() {
      return this.routerPush({
        name: "Canvas without position",
        params: {
          ids: this.$route.params.ids,
        },
      });
    },
    updateURLPosition() {
      const { x, y } = this.net.getViewPosition();
      const scale = this.net.getScale();

      return this.routerPush({
        name: "Canvas with position",
        params: {
          ids: this.$route.params.ids,
          x: Math.round(x),
          y: Math.round(y),
          scale: Math.round(scale * 1000) / 1000 || 0.001,
        },
      });
    },
    updateURLSelection() {
      const { nodes, edges } = this.net.getSelection();

      let ids;
      if (nodes.length || edges.length) {
        ids = [...nodes, ...edges].join(",");
      } else {
        ids = null;
      }

      return this.routerPush({
        params: {
          ...this.$route.params,
          ids,
        },
      });
    },
    applyURL() {
      const { ids, x, y, scale } = this.$route.params;

      if (ids) {
        const idsArray = ids.split(",");
        this.net.setSelection({
          nodes: idsArray.filter((id) => this.nodes.get(id)),
          edges: idsArray.filter((id) => this.edges.get(id)),
        });
      }

      if (x != null && y != null && scale != null) {
        this.net.moveTo({
          position: { x: +x, y: +y },
          scale: +scale,
        });
      } else {
        this.fitSelected(false);
      }
    },
    init({ container, net, nodes, edges }) {
      this.net = net;
      this.nodes = nodes;
      this.edges = edges;

      // Save new positions if any missing
      this.commitUncommitedPositions();

      // Manipulation
      this.net.setOptions({
        manipulation: {
          enabled: false,
          addNode: async (node, callback) => {
            callback(); // Node will be added via reactivity from Vuex

            const newItem = { ...this.newItem };
            this.newItem.set();

            node.group = newItem.type;
            node.label = newItem.label;

            const closestId = newItem.connectTo
              ? this.getClosestId(node.x, node.y, newItem.connectTo, 500)
              : null;
            node.label =
              newItem.label ||
              (baseHostnames[node.group]
                ? this.getNextFreeHostname(node.group, closestId)
                : "");

            const { node: edited, item } = newItem.noEdit
              ? {
                  node,
                  item: {
                    id: node.id,
                    type: node.group,
                    hostname: node.label,
                  },
                }
              : await this.editItem(node, false);
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
                nodePriorities.indexOf(this.data.items[closestId].type)
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

            const ports = portAmounts[edited.group] || 0;
            if (ports > 0) {
              const coords = this.generateOrganizedPortCoors(edited, ports);
              for (let i = 0; i < ports; ++i) {
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

            this.commit("replaceItems", items);
          },
          editNode: async (node, callback) => {
            this.newItem.set();
            await this.editItem(node);
            callback();
          },
          addEdge: async (edge, callback) => {
            callback(); // Edge will be added via reactivity from Vuex

            this.orderNodes(edge);
            const type = this.getEdgeType(edge);
            if (this.isEdgeValid(edge, type)) {
              edge.id = edge.id || randomUUID();
              edge.group = type;
              edge.label = "";

              await this.editItem(edge);
            }

            this.newItem.set();
          },
          editEdge: async (edge, callback) => {
            this.orderNodes(edge);
            if (this.isEdgeValid(edge, this.getEdgeType(edge))) {
              await this.editItem(edge);
              callback();
            } else {
              callback();
            }

            this.newItem.set();
          },
        },
      });

      // Events
      this.net.on("deselectNode", deselectHandler.bind(null, this.net));
      this.net.on("deselectEdge", deselectHandler.bind(null, this.net));
      this.net.on("doubleClick", async (event) => {
        if (event.nodes.length === 0 && event.edges.length === 1) {
          const id = event.edges[0];
          await this.editItem(this.edges.get(id));
        } else if (event.nodes.length === 1) {
          this.net.editNode();
        }
      });
      this.net.on("hold", (event) => {
        if (event.nodes.length === 0 && event.edges.length === 1) {
          this.net.editEdgeMode();
        } else if (event.nodes.length === 1) {
          const node = this.nodes.get(event.nodes[0]);
          if (node.group === "host" || node.group === "switch") {
            this.organizePorts(node);
          }
        }
      });
      this.net.on("dragEnd", (event) => {
        if (event.nodes.length > 0) {
          this.commitPositions(event.nodes);
        }
      });
      this.net.on("dragStart", (event) => {
        if (event.nodes.length !== 1) {
          return;
        }
        const nodeItem = this.data.items[event.nodes[0]];
        if (!(nodeItem.type === "host" || nodeItem.type === "switch")) {
          return;
        }

        const toSelect = new Set();
        this.net.getSelectedEdges().forEach((edgeId) => {
          const edge = this.edges.get(edgeId);
          toSelect.add(edge.to);
          toSelect.add(edge.from);
        });
        const toSelectFiltered = [...toSelect].filter(
          (nodeId) => this.data.items[nodeId].type === "port"
        );
        if (toSelectFiltered.length) {
          this.net.selectNodes([event.nodes[0], ...toSelectFiltered]);
        }
      });

      // URL changing events
      this.net.on("dragEnd", delayCall(this.updateURLPosition));
      this.net.on("select", delayCall(this.updateURLPosition));
      this.net.on("select", delayCall(this.updateURLSelection));
      this.net.on("zoom", delayCall(this.updateURLPosition, 200));

      // Focus items
      this.applyURL();

      // Set rectangular selection up
      const rs = new RectangularSelection(
        container,
        this.net,
        this.nodes,
        selectionTheme
      );
      rs.attach();
    },
  },
};
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
