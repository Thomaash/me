<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Label" v-model="item.hostname" autofocus :error-messages="errors.item.hostname" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-select label="Type" :items="controllerTypes" v-model="item.controllerType" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="IP" v-model="item.ip" :error-messages="errors.item.ip" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field label="Port" v-model.number="item.port" type="number" min="1" max="65535" :error-messages="errors.item.port" clearable/>
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
import errors from './errors'
import { required, hostname, ip, port } from './rules'

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
  mixins: [common, errors],
  data: () => ({
    valid: false,
    item: {},
    controllerTypes,
    protocols
  }),
  validations: {
    item: {
      hostname: { required, hostname },
      ip: { ip },
      port: { port }
    }
  }
}
</script>

<style scoped>
</style>
