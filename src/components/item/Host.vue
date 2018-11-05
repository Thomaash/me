<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Hostname" v-model="item.hostname" :error-messages="hostnameErrors"/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Default Route" v-model="item.defaultRoute" :error-messages="defaultRouteErrors" clearable/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from './common'
import { required, hostname, ip } from './rules'

export default {
  name: 'HostEdit',
  mixins: [common],
  data: () => ({
    valid: false,
    item: {}
  }),
  computed: {
    hostnameErrors () {
      return [
        ...(this.$v.item.hostname.required ? [] : ['Hostname is required.']),
        ...(this.$v.item.hostname.hostname ? [] : ['Invalid hostname.'])
      ]
    },
    defaultRouteErrors () {
      return [
        ...(this.$v.item.defaultRoute.ip ? [] : ['Invalid IP address.'])
      ]
    }
  },
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
