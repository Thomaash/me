<template>
  <v-card-text>
    <v-form v-model="valid">
      <v-container grid-list-md>
        <v-layout wrap>
          <v-flex xs12>
            <v-text-field label="Label" v-model="item.hostname" clearable/>
          </v-flex>
        </v-layout>
      </v-container>
    </v-form>
  </v-card-text>
</template>

<script>
import common from './common'

export default {
  name: 'AssociationEdit',
  mixins: [common],
  data: () => ({
    valid: false,
    item: {}
  })
}
</script>

<style scoped>
</style>
