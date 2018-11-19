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
import { required, hostname, ip } from '@/validation/rules'

export default {
  name: 'HostEdit',
  mixins: [common, errors],
  data: () => ({
    valid: false,
    item: {}
  }),
  validations: {
    item: {
      hostname: { required, hostname },
      defaultRoute: { ip }
    }
  }
}
</script>

<style scoped>
</style>
