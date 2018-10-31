<template>
  <v-card-text>
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Label" required v-model="item.hostname"/>
        </v-flex>
        <v-flex xs12 sm8>
          <v-select label="Type" clearable :items="controllerTypes" v-model="item.controllerType"/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="IP" v-model="item.ip"/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Port" v-model.number="item.port"/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card-text>
</template>

<script>
const controllerTypes = [
  { value: 'NOX', text: 'NOX' },
  { value: 'OVSController', text: 'OVSController' },
  { value: 'RemoteController', text: 'RemoteController' },
  { value: 'Ryu', text: 'Ryu' }
]

export default {
  name: 'ControllerEdit',
  props: ['value'],
  data: () => ({
    dialog: false,
    controllerTypes: controllerTypes,
    item: {}
  }),
  watch: {
    item (val) {
      this.$emit('input', val)
    },
    value (val) {
      this.item = val
    }
  },
  mounted () {
    this.item = this.value
  }
}
</script>

<style scoped>
</style>
