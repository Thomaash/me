<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Hostname" v-model="item.hostname" autofocus :error-messages="errors.item.hostname"/>
        </v-flex>
        <v-flex xs12>
          <v-select label="Type" :items="switchTypes" v-model="item.switchType" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-select label="STP" :items="enabledDisabled" v-model="item.stp" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field label="STP Priority" v-model.number="item.stpPriority" type="number" step="4096" min="0" max="65535" :error-messages="errors.item.stpPriority" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="IP" v-model="item.ip" :error-messages="errors.item.ip" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="DPCTL Port" v-model.number="item.dpctlPort" type="number" min="1" max="65535" :error-messages="errors.item.dpctlPort" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-select label="Protocol" :items="protocolsOF" v-model="item.protocol" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-select label="Datapath" :items="datapaths" v-model="item.datapath" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field label="Datapath ID" v-model="item.dpid" type="text" :error-messages="errors.item.dpid" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Ofdatapath arguments" v-model="item.dpopts" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Reconnect Timeout" v-model.number="item.reconnectms" type="number" min="0" suffix="ms" :error-messages="errors.item.reconnectms" clearable/>
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
        <v-flex xs12>
          <v-select label="Verbose" :items="enabledDisabled" v-model="item.verbose" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Additional Switch Options" v-model="item.opts" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-textarea label="Startup Script" v-model="item.script" auto-grow clearable/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from './common'
import errors from '@/validation/errors'
import { required, hostname, integer, between, divisible, minValue, minLength, maxLength, hexData, ip, port } from '@/validation/rules'
import { switchTypes, failModes, datapaths, protocolsOF, enabledDisabled } from '@/selects'

export default {
  name: 'SwitchEdit',
  mixins: [common, errors],
  data: () => ({
    valid: false,
    item: {},
    switchTypes,
    failModes,
    datapaths,
    protocolsOF,
    enabledDisabled
  }),
  validations: {
    item: {
      dpctlPort: { port },
      dpid: { hexData, minLength: minLength(1), maxLength: maxLength(16) },
      hostname: { required, hostname },
      ip: { ip },
      reconnectms: { integer, minValue: minValue(0) },
      stpPriority: { integer, between: between(0, 65535), divisible: divisible(4096) }
    }
  }
}
</script>

<style scoped>
</style>
