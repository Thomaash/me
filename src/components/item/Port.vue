<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Dev Name" v-model="item.hostname" :error-messages="hostnameErrors" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-textarea label="IPs" v-model="ips" :error-messages="ipsErrors" clearable/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from './common'
import { required, hostname, ipsWithMasks } from './rules'

export default {
  name: 'PortEdit',
  mixins: [common],
  data: () => ({
    valid: false,
    item: {}
  }),
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
    },
    hostnameErrors () {
      return [
        ...(this.$v.item.hostname.required ? [] : ['Hostname is required.']),
        ...(this.$v.item.hostname.hostname ? [] : ['Invalid hostname.'])
      ]
    },
    ipsErrors () {
      return [
        ...(this.$v.item.ips.ipsWithMasks ? [] : ['Invalid IP(s).'])
      ]
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
