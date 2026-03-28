<template>
  <section>
    <h3 class="headline">Bindings</h3>

    <v-data-table
      :headers="headers"
      :items="items"
      item-key="combination"
      :items-per-page="items.length"
      :sort-by="[]"
      hide-default-footer
      class="elevation-1"
    >
      <template #[`item.combination`]="{ item }">
        <div
          class="with-title combination"
          :title="getTitleFor(item.combination)"
        >
          <component
            :is="c.tag"
            v-for="(c, i) in parse(item.combination)"
            :key="i"
            class="monospace"
            >{{ c.text }}</component
          >
        </div>
      </template>
      <template #[`item.description`]="{ item }">
        {{ item.description }}
      </template>
    </v-data-table>
  </section>
</template>

<script setup>
defineOptions({ name: "BindingsList" });

import { ref, onMounted, onBeforeUnmount, markRaw } from "vue";
import { VIcon } from "vuetify/components";

const headers = [
  { text: "Combination", value: "combination" },
  { text: "Description", value: "description" },
];

const items = [
  { combination: "LMB - :node", description: "Place a new node." },
  {
    combination: "LMB - :port",
    description: "Place a new port (connects to a nearby switch or host).",
  },
  { combination: "LMB @ :item", description: "Select the node or edge." },
  { combination: "LMB2 @ :item", description: "Edit the item." },
  {
    combination: "LMBd - :edge",
    description: "Connect two nodes with a link or an association.",
  },
  { combination: "LMBd @ :node", description: "Move the node." },
  { combination: "LMBd", description: "Move the viewport." },
  {
    combination: "LMBlp @ :edge",
    description: "Reconnect a link or an association.",
  },
  {
    combination: "LMBlp @ :swho",
    description: "Organize the ports of a switch or host.",
  },
  {
    combination: "ctrl + LMB @ :item",
    description: "Select or unselect multiple items.",
  },

  { combination: "RMBd", description: "Rectangular selection of nodes." },
  {
    combination: "ctrl + RMBd",
    description: "Remove nodes from the selection.",
  },
  {
    combination: "shift + RMBd",
    description: "Add nodes to the selection.",
  },

  { combination: "a", description: "Fit all items into the viewport." },
  { combination: "c", description: "Add a controller." },
  { combination: "d", description: "Delete selected items." },
  { combination: "e", description: "Add an edge." },
  {
    combination: "f",
    description: "Fit selected items into the viewport.",
  },
  { combination: "h", description: "Add a host." },
  {
    combination: "i",
    description:
      "Add a label witch IPS placeholder (autoconnects to the closest).",
  },
  { combination: "l", description: "Add a label." },
  {
    combination: "p",
    description: "Add a port (autoconnects to the closest).",
  },
  { combination: "s", description: "Add a switch." },
  {
    combination: "t",
    description:
      "Add a label with TYPES placeholder (autoconnects to the closest).",
  },
  { combination: "z", description: "Reset zoom." },

  { combination: "ctrl + a", description: "Select all." },
  { combination: "ctrl + y", description: "Redo undone change." },
  { combination: "ctrl + z", description: "Undo a change." },

  { combination: "del", description: "Delete selected items." },
  {
    combination: "esc",
    description: "Stop editing edges or adding items.",
  },
];

const special = {
  "@": { tag: "span", text: " @ ", title: "on" },
  "+": { tag: "span", text: " + ", title: "and" },
  "-": { tag: "span", text: " ", title: "with" },

  LMB: { tag: "kbd", text: "LMB", title: "left mouse button click" },
  LMB2: {
    tag: "kbd",
    text: "2·LMB",
    title: "double left mouse button click",
  },
  LMBd: {
    tag: "kbd",
    text: "LMB →",
    title: "drag with left mouse button pressed",
  },
  LMBlp: {
    tag: "kbd",
    text: "   LMB   ",
    title: "long press left mouse button",
  },
  RMBd: {
    tag: "kbd",
    text: "RMB →",
    title: "drag with right mouse button pressed",
  },

  ctrl: { tag: "kbd", text: "CTRL", title: "hold control" },
  shift: { tag: "kbd", text: "SHIFT", title: "hold shift" },

  del: { tag: "kbd", text: "DEL", title: "press delete" },
  esc: { tag: "kbd", text: "ESC", title: "press escape" },

  ":edge": {
    tag: markRaw(VIcon),
    text: "$net-edge",
    title: "link or association",
  },
  ":item": {
    tag: markRaw(VIcon),
    text: "$net-host",
    title: "port, host, switch, controller, label, link or association",
  },
  ":node": {
    tag: markRaw(VIcon),
    text: "$net-host",
    title: "port, host, switch, controller or label",
  },
  ":swho": {
    tag: markRaw(VIcon),
    text: "$net-host",
    title: "switch or host",
  },
  ":port": {
    tag: markRaw(VIcon),
    text: "$net-port",
    title: "port",
  },
};

const nodeIcons = ["port", "host", "switch", "controller", "dummy"];
const itemIcons = ["edge", "port", "host", "switch", "controller", "dummy"];
const swhoIcons = ["host", "switch"];
const iconsIndex = ref(Math.floor(Math.random() * 100));
const simpleKeyRE = /^[a-z]$/;
let timer = null;

function parse(str) {
  return str.split(" ").map((val) => {
    if (special[val]) {
      return special[val];
    } else if (simpleKeyRE.test(val)) {
      const text = val.toUpperCase();
      return { tag: "kbd", text: text, title: "press " + text };
    } else {
      return { tag: "span", text: " " + val + " ", title: val };
    }
  });
}

function getTitleFor(str) {
  return parse(str)
    .map((c) => c.title)
    .join(" ");
}

function update() {
  ++iconsIndex.value;
  special[":node"].text =
    "$net-" + nodeIcons[iconsIndex.value % nodeIcons.length];
  special[":item"].text =
    "$net-" + itemIcons[iconsIndex.value % itemIcons.length];
  special[":swho"].text =
    "$net-" + swhoIcons[iconsIndex.value % swhoIcons.length];
}

onMounted(() => {
  update();
  timer = window.setInterval(() => update(), 2000);
});

onBeforeUnmount(() => {
  window.clearInterval(timer);
});

defineExpose({ iconsIndex });
</script>

<style scoped>
.with-title {
  cursor: help;
}
.combination {
  white-space: nowrap;
}
kbd {
  background-color: #eee;
  border-radius: 3px;
  border: 1px solid #b4b4b4;
  box-shadow:
    0 1px 1px rgba(0, 0, 0, 0.2),
    0 2px 0 0 rgba(255, 255, 255, 0.7) inset;
  color: #333;
  display: inline-block;
  font-size: 0.85em;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  white-space: nowrap;
}
</style>
