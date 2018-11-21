<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Hostname" v-model="item.hostname" autofocus :error-messages="errors.item.hostname"/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Default Route" v-model="item.defaultRoute" :error-messages="errors.item.defaultRoute" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-select label="Scheduler" :items="schedulers" v-model="item.cpuScheduler" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field label="CPU Utilization Limit" v-model.number="item.cpuLimit" type="number" min="0" max="1" step=".01" :error-messages="errors.item.cpuLimit" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="CPU cores" v-model="cpuCoresStr" :error-messages="errors.item.cpuCores" clearable/>
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
import { required, hostname, ip, between, decimal, naturalNumberList } from '@/validation/rules'
import { schedulers } from '@/selects'

export default {
  name: 'HostEdit',
  mixins: [common, errors],
  data: () => ({
    valid: false,
    item: {},
    schedulers,
    cpuCoresStrInit: ''
  }),
  computed: {
    cpuCoresStr: {
      get () {
        return this.cpuCoresStrInit
      },
      set (val) {
        if (val == null) {
          delete this.item.cpuCores
        } else {
          this.item.cpuCores = val
            .split(/\s*[\s,]\s*/g)
            .map(str => isNaN(str) ? str : parseInt(str))
            .sort((a, b) => a - b)
            .filter((value, index, array) => array[index - 1] !== value)
        }
      }
    }
  },
  validations: {
    item: {
      cpuCores: { naturalNumberList },
      cpuLimit: { decimal, between: between(0, 1) },
      defaultRoute: { ip },
      hostname: { required, hostname }
    }
  },
  created () {
    this.$on('new-item', (...args) => {
      this.cpuCoresStrInit = (this.item.cpuCores || [])
        .join(', ')
    })
  }
}
</script>

<style scoped>
</style>
