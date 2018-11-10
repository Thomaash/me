<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Label" v-model="item.hostname" autofocus :error-messages="hostnameErrors" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-select label="Type" :items="controllerTypes" v-model="item.controllerType" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="IP" v-model="item.ip" :error-messages="ipErrors" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field label="Port" v-model.number="item.port" :error-messages="portErrors" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-select label="Protocol" :items="protocols" v-model="item.protocol" clearable/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from './common'
import { required, hostname, ip, integer, between } from './rules'

const controllerTypes = [
  { value: 'NOX', text: 'NOX' },
  { value: 'OVSController', text: 'OVSController' },
  { value: 'RemoteController', text: 'RemoteController' },
  { value: 'Ryu', text: 'Ryu' }
]
const protocols = [
  { value: 'tcp', text: 'TCP' },
  { value: 'upd', text: 'UDP' }
]

export default {
  name: 'ControllerEdit',
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
    controllerTypes,
    protocols
  }),
  computed: {
    hostnameErrors () {
      return [
        ...(this.$v.item.hostname.required ? [] : ['Hostname is required.']),
        ...(this.$v.item.hostname.hostname ? [] : ['Invalid hostname.'])
      ]
    },
    ipErrors () {
      return [
        ...(this.$v.item.ip.ip ? [] : ['Invalid IP address.'])
      ]
    },
    portErrors () {
      return [
        ...(this.$v.item.port.integer ? [] : ['The port has to be positive integer.']),
        ...(this.$v.item.port.between ? [] : ['The port has to be between 1 and 65535.'])
      ]
    }
  },
  validations: {
    item: {
      hostname: { required, hostname },
      ip: { ip },
      port: { integer, between: between(1, 65535) }
    }
  }
}
</script>

<style scoped>
</style>
