<template>
  <v-container grid-list-md>
    <LoadingSpinner v-if="loading !== false" />
    <template v-else>
      <v-row>
        <v-col cols="12" class="py-5">
          <h3 class="headline">Import</h3>

          <ImportSection @log="(l) => (log = l)" />
        </v-col>

        <v-col cols="12" class="pb-5">
          <h3 class="headline">Export</h3>

          <ExportSection @log="(l) => (log = l)" />
        </v-col>

        <v-expand-transition>
          <v-col v-if="log.length" cols="12" class="pb-5">
            <h3 class="headline">Log</h3>

            <LogListing :log="log" />
          </v-col>
        </v-expand-transition>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import ExportSection from "./export/ExportSection.vue";
import ImportSection from "./export/ImportSection.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import LogListing from "./export/LogListing.vue";
import { useTopologyStore } from "@/composables/useTopologyStore";

const { loading } = useTopologyStore();
const log = ref([]);
</script>
