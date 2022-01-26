<template>
  <v-container grid-list-md>
    <LoadingSpinner v-if="loading !== false" />
    <template v-else>
      <v-layout wrap>
        <v-flex xs12 py-5>
          <h3 class="headline">Import</h3>

          <ImportSection @log="(l) => (log = l)" />
        </v-flex>

        <v-flex xs12 pb-5>
          <h3 class="headline">Export</h3>

          <ExportSection @log="(l) => (log = l)" />
        </v-flex>

        <v-slide-y-transition mode="out-in">
          <v-flex v-if="log.length" xs12 pb-5>
            <h3 class="headline">Log</h3>

            <LogListing :log="log" />
          </v-flex>
        </v-slide-y-transition>
      </v-layout>
    </template>
  </v-container>
</template>

<script>
import ExportSection from "./export/ExportSection";
import ImportSection from "./export/ImportSection";
import LoadingSpinner from "@/components/LoadingSpinner";
import LogListing from "./export/LogListing";

export default {
  name: "ExportPage",
  components: { ExportSection, ImportSection, LoadingSpinner, LogListing },
  data: () => ({
    log: [],
  }),
  computed: {
    loading() {
      return this.$store.state.loading;
    },
  },
};
</script>
