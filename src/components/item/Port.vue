<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Dev Name" v-model="item.hostname" autofocus :error-messages="errors.item.hostname" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-textarea label="IPs" v-model="ips" :error-messages="errors.item.ips" auto-grow clearable/>
        </v-flex>
        <v-flex xs12>
          <v-switch label="Physical" v-model="item.physical"/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from './common'
import errors from './errors'
import { required, hostname, ipsWithMasks } from './rules'

export default {
  name: 'PortEdit',
  mixins: [common, errors],
  data: () => ({
    valid: false,
    item: {}
  }),
  watch: {
    'item.physical' (val) {
      if (val === false) {
        // Omit physical property if false
        delete this.$delete(this.item, 'physical')
      }
    }
  },
  computed: {
    ips: {
      get () {
        return (this.item.ips || []).join('\n')
      },
      set (val) {
        if (val) {
          this.$set(this.item, 'ips', val.split('\n').filter(line => line !== ''))
        } else {
          this.$delete(this.item, 'ips')
        }
      }
    }
  },
  validations: {
    item: {
      hostname: { required, hostname },
      ips: { ipsWithMasks }
    }
  }
}
</script>

<style scoped>
</style>
