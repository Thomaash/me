<template>
  <v-card-text>
    <v-form v-model="valid">
      <v-container grid-list-md>
        <v-layout wrap>
          <v-flex xs12 sm6 md4>
            <v-text-field label="Hostname" v-model="item.hostname" :error-messages="hostnameErrors"/>
          </v-flex>
          <v-flex xs12 sm6 md4>
            <v-select label="Type" clearable :items="switchTypes" v-model="item.switchType"/>
          </v-flex>
        </v-layout>
      </v-container>
    </v-form>
  </v-card-text>
</template>

<script>
import common from './common'
import { required, hostname } from './rules'

const switchTypes = [
  { value: 'IVSSwitch', text: 'IVSSwitch' },
  { value: 'LinuxBridge', text: 'LinuxBridge' },
  { value: 'OVSBridge', text: 'OVSBridge' },
  { value: 'OVSSwitch', text: 'OVSSwitch' },
  { value: 'UserSwitch', text: 'UserSwitch' }
]

export default {
  name: 'SwitchEdit',
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
    switchTypes: switchTypes
  }),
  computed: {
    hostnameErrors () {
      return [
        ...(this.$v.item.hostname.required ? [] : ['Hostname is required.']),
        ...(this.$v.item.hostname.hostname ? [] : ['Invalid hostname.'])
      ]
    }
  },
  validations: {
    item: {
      hostname: { required, hostname }
    }
  }
}
</script>

<style scoped>
</style>
