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

<script>
export default {
  name: "LogListing",
  props: {
    log: {
      type: Array,
      required: true,
    },
  },
  data: () => ({
    logCbs: [],
    logPriority: {
      error: 0,
      warning: 1,
      info: 2,
    },
  }),
  computed: {
    sortedLog() {
      return [...this.log].sort(
        ({ severity: a }, { severity: b }) =>
          this.logPriority[a] - this.logPriority[b],
      );
    },
  },
  methods: {
    selectInCanvas(id) {
      let ids;
      if (id) {
        ids = [id];
      } else if (this.logCbs.some((cb) => cb)) {
        ids = this.logCbs
          .map((cb, i) => (cb ? i : null))
          .filter((i) => i !== null)
          .map((i) => this.sortedLog[i].item.id);
      } else {
        ids = this.sortedLog.map((l) => l.item.id);
      }

      this.$router.push({
        name: "Canvas without position",
        params: { ids: ids.join(",") },
      });
    },
  },
};
</script>
