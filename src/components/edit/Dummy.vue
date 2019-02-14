<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-textarea
            auto-grow
            autofocus
            clearable
            label="Label"
            style="font-family: monospace;"
            v-model="item.hostname"
          />
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from './common'

export default {
  name: 'DummyEdit',
  mixins: [common],
  data: () => ({
    valid: false,
    item: {}
  })
}
</script>

<style scoped>
</style>
