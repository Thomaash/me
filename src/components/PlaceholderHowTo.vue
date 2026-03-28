<template>
  <section>
    <h3 class="text-h6">Placeholders</h3>

    <p>
      Placeholders can be used in labels to display information about connected
      node or nodes.
    </p>

    <v-data-table
      :headers="headers"
      :items="items"
      :items-per-page="items.length"
      :sort-by="[]"
      hide-default-footer
      class="elevation-1"
    >
      <template #items="{ item }">
        <td class="monospace" v-text="item.name" />
        <td v-text="item.description" />
        <td v-text="item.multiline" />
      </template>
    </v-data-table>
  </section>
</template>

<script setup>
defineOptions({ name: "PlaceholderHowTo" });

import { ref } from "vue";

const headers = ref([
  { title: "Placeholder", key: "name" },
  { title: "Description", key: "description" },
  { title: "Multiline", key: "multiline" },
]);

const items = ref([
  {
    name: "{{HOSTNAMES}}",
    description: "Lists hostnames of connected nodes.",
    multiline: "no",
  },
  {
    name: "{{IPS}}",
    description: "Lists IPs of connected nodes.",
    multiline: "with multiple IPs or nodes",
  },
  {
    name: "{{TYPES}}",
    description: "Lists types of connected nodes.",
    multiline: "with multiple nodes",
  },
]);
</script>

<style scoped>
.v-icon {
  height: 1ex;
}
.with-title {
  cursor: help;
}
</style>
