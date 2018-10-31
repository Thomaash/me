<template>
  <v-card-text>
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Hostname" required v-model="item.hostname"/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-select label="Type" clearable :items="switchTypes" v-model="item.switchType"/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card-text>
</template>

<script>
const switchTypes = [
  { value: 'IVSSwitch', text: 'IVSSwitch' },
  { value: 'LinuxBridge', text: 'LinuxBridge' },
  { value: 'OVSBridge', text: 'OVSBridge' },
  { value: 'OVSSwitch', text: 'OVSSwitch' },
  { value: 'UserSwitch', text: 'UserSwitch' }
]

export default {
  name: 'SwitchEdit',
  props: ['value'],
  data: () => ({
    dialog: false,
    switchTypes: switchTypes,
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
