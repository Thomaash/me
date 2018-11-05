<template>
  <v-card-text>
    <v-form v-model="valid">
      <v-container grid-list-md>
        <v-layout wrap>
          <v-flex xs12>
            <v-text-field label="Hostname" v-model="item.hostname" :error-messages="hostnameErrors"/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Type" :items="switchTypes" v-model="item.switchType" clearable/>
          </v-flex>
          <v-flex xs12 md6>
            <v-select label="STP" :items="enabledDisabled" v-model="item.stp" clearable/>
          </v-flex>
          <v-flex xs12 md6>
            <v-text-field label="STP Priority" v-model.number="item.stpPriority" type="number" step="4096" min="0" max="65535" :error-messages="stpPriorityErrors" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Datapath" :items="datapaths" v-model="item.datapath" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Protocol" :items="protocols" v-model="item.protocol" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-text-field label="Ofdatapath arguments" v-model="item.dpopts" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-text-field label="Reconnect Timeout" v-model.number="item.reconnectms" type="number" min="0" suffix="ms" :error-messages="reconnectmsErrors" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Fail Mode" :items="failModes" v-model="item.failMode" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Inband" :items="enabledDisabled" v-model="item.inband" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Batch" :items="enabledDisabled" v-model="item.batch" clearable/>
          </v-flex>
        </v-layout>
      </v-container>
    </v-form>
  </v-card-text>
</template>

<script>
import common from './common'
import { required, hostname, integer, between, divisible, minValue } from './rules'

const switchTypes = [
  { value: 'IVSSwitch', text: 'IVSSwitch' },
  { value: 'LinuxBridge', text: 'LinuxBridge' },
  { value: 'OVSBridge', text: 'OVSBridge' },
  { value: 'OVSSwitch', text: 'OVSSwitch' },
  { value: 'UserSwitch', text: 'UserSwitch' }
]
const failModes = [
  { value: 'secure', text: 'Secure' },
  { value: 'standalone', text: 'Standalone' }
]
const datapaths = [
  { value: 'kernel', text: 'Kernel' },
  { value: 'user', text: 'User' }
]
const protocols = [
  { value: 'OpenFlow12', text: 'OpenFlow 1.2' },
  { value: 'OpenFlow13', text: 'OpenFlow 1.3' },
  { value: 'OpenFlow14', text: 'OpenFlow 1.4' },
  { value: 'OpenFlow15', text: 'OpenFlow 1.5' }
]
const enabledDisabled = [
  { value: true, text: 'Enabled' },
  { value: false, text: 'Disabled' }
]

export default {
  name: 'SwitchEdit',
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
    switchTypes,
    failModes,
    datapaths,
    protocols,
    enabledDisabled
  }),
  computed: {
    hostnameErrors () {
      return [
        ...(this.$v.item.hostname.required ? [] : ['Hostname is required.']),
        ...(this.$v.item.hostname.hostname ? [] : ['Invalid hostname.'])
      ]
    },
    stpPriorityErrors () {
      return [
        ...(this.$v.item.stpPriority.integer ? [] : ['Priority has to be an integer.']),
        ...(this.$v.item.stpPriority.between ? [] : ['Priority has to be between 0 and 65535 inclusive.']),
        ...(this.$v.item.stpPriority.divisible ? [] : ['Priority has to be a multiple of 4096.'])
      ]
    },
    reconnectmsErrors () {
      return [
        ...(this.$v.item.reconnectms.integer ? [] : ['Reconnect timeout has to be an integer.']),
        ...(this.$v.item.reconnectms.minValue ? [] : ['Reconnect timeout has to be an non-negative.'])
      ]
    }
  },
  validations: {
    item: {
      hostname: { required, hostname },
      stpPriority: { integer, between: between(0, 65535), divisible: divisible(4096) },
      reconnectms: { integer, minValue: minValue(0) }
    }
  }
}
</script>

<style scoped>
</style>
