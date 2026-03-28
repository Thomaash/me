<template>
  <v-row>
    <v-col cols="12">
      <v-list>
        <v-list-item
          v-for="(l, i) in sortedLog"
          :key="'export_log_' + i"
          @click.prevent="logCbs[i] = !logCbs[i]"
        >
          <template #prepend>
            <v-checkbox v-model="logCbs[i]" color="primary" hide-details />
          </template>
          <v-list-item-title>{{ l.msg }}</v-list-item-title>
          <template #append>
            <v-btn variant="plain" @click="selectInCanvas(l.item.id)">
              <v-icon :color="l.severity">{{ `$${l.severity}` }}</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-col>

    <v-col cols="12">
      <v-btn variant="outlined" block color="primary" @click="selectInCanvas()"
        >Select in the Canvas</v-btn
      >
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  log: {
    type: Array,
    required: true,
  },
});

const router = useRouter();

const logCbs = ref([]);
const logPriority = {
  error: 0,
  warning: 1,
  info: 2,
};

const sortedLog = computed(() => {
  return [...props.log].sort(
    ({ severity: a }, { severity: b }) => logPriority[a] - logPriority[b],
  );
});

function selectInCanvas(id) {
  let ids;
  if (id) {
    ids = [id];
  } else if (logCbs.value.some((cb) => cb)) {
    ids = logCbs.value
      .map((cb, i) => (cb ? i : null))
      .filter((i) => i !== null)
      .map((i) => sortedLog.value[i].item.id);
  } else {
    ids = sortedLog.value.map((l) => l.item.id);
  }

  router.push({
    name: "Canvas without position",
    params: { ids: ids.join(",") },
  });
}
</script>
