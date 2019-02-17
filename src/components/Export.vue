<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex xs12 pb-5>
        <h3 class="headline">Import</h3>

        <Imports @log="l => log = l" />
      </v-flex>

      <v-flex xs12 pb-5>
        <h3 class="headline">Export</h3>

        <Exports @log="l => log = l" />
      </v-flex>

      <v-slide-y-transition mode="out-in">
        <v-flex xs12 pb-5 v-if="log.length">
          <h3 class="headline">Log</h3>

          <Log :log="log" />
        </v-flex>
      </v-slide-y-transition>
    </v-layout>
  </v-container>
</template>

<script>
import Exports from './export/Exports'
import Imports from './export/Imports'
import Log from './export/Log'

export default {
  name: 'Export',
  components: { Exports, Imports, Log },
  data: () => ({
    log: []
  })
}
</script>
