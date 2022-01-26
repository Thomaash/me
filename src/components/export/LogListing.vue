<template>
  <v-layout row wrap>
    <v-flex xs12>
      <v-list>
        <v-list-item
          v-for="(l, i) in sortedLog"
          :key="'export_log_' + i"
          @click.prevent
        >
          <v-list-item-action>
            <v-checkbox v-model="logCbs[i]" color="primary" hide-details />
          </v-list-item-action>
          <v-list-item-content @click="$set(logCbs, i, !logCbs[i])">
            <v-list-item-title v-text="l.msg" />
          </v-list-item-content>
          <v-list-item-avatar @click="selectInCanvas(l.item.id)">
            <v-icon
              :color="l.severity"
              v-text="'$vuetify.icons.' + l.severity"
            />
          </v-list-item-avatar>
        </v-list-item>
      </v-list>
    </v-flex>

    <v-flex xs12>
      <v-btn outlined block color="primary" @click="selectInCanvas()"
        >Select in the Canvas</v-btn
      >
    </v-flex>
  </v-layout>
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
          this.logPriority[a] - this.logPriority[b]
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
        name: "Canvas",
        params: { ids: ids.join(",") },
      });
    },
  },
};
</script>
