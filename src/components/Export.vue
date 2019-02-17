<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex xs12>
        <h3 class="headline">Import</h3>
      </v-flex>

      <v-flex xs12>
        <Imports @log="l => log = l" />
      </v-flex>

      <v-flex xs12 pt-5>
        <h3 class="headline">Export</h3>
      </v-flex>

      <v-flex xs12>
        <Exports @log="l => log = l" />
      </v-flex>

      <v-slide-y-transition mode="out-in">
        <v-flex xs12 pt-5 v-if="log.length">
          <h3 class="headline">Log</h3>
        </v-flex>
      </v-slide-y-transition>

      <v-slide-y-transition mode="out-in">
        <v-flex xs12 v-if="log.length">
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
