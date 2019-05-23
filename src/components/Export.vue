<template>
  <v-container grid-list-md>
    <LoadingSpinner v-if="loading !== false" />
    <template v-else>
      <v-layout wrap>
        <v-flex xs12 py-5>
          <h3 class="headline">Import</h3>

          <Imports @log="l => log = l" />
        </v-flex>

        <v-flex xs12 pb-5>
          <h3 class="headline">Export</h3>

          <Exports @log="l => log = l" />
        </v-flex>

        <v-slide-y-transition mode="out-in">
          <v-flex v-if="log.length" xs12 pb-5>
            <h3 class="headline">Log</h3>

            <Log :log="log" />
          </v-flex>
        </v-slide-y-transition>
      </v-layout>
    </template>
  </v-container>
</template>

<script>
import Exports from './export/Exports'
import Imports from './export/Imports'
import LoadingSpinner from '@/components/LoadingSpinner'
import Log from './export/Log'

export default {
  name: 'Export',
  components: { Exports, Imports, LoadingSpinner, Log },
  data: () => ({
    log: []
  }),
  computed: {
    loading () {
      return this.$store.state.loading
    }
  }
}
</script>
