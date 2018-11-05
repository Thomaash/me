<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-textarea label="Label" required v-model="item.hostname" clearable/>
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
