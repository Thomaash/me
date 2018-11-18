<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex xs12 lg6 :class="{ 'pr-4': $vuetify.breakpoint.lgAndUp }">
        <v-layout wrap>
          <v-flex xs12>
            <v-text-field label="IP Base" v-model="ipBase" :error-messages="errors.ipBase" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-text-field label="Base Listening Port" v-model.number="listenPortBase" type="number" min="1" max="65535" :error-messages="errors.listenPortBase" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Automatic MAC Addresses" :items="enabledDisabled" v-model="autoSetMAC" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Automatic Static ARP" :items="enabledDisabled" v-model="autoStaticARP" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="In Namespace" :items="enabledDisabled" v-model="inNamespace" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-select label="Spawn Terminals" :items="enabledDisabled" v-model="spawnTerminals" clearable/>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex xs12 lg6 :class="{ 'pl-4': $vuetify.breakpoint.lgAndUp }">
        <v-layout wrap>
          <v-flex xs12>
            <v-textarea label="Startup Script" v-model="script" autofocus auto-grow/>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import errors from '@/validation/errors'
import { enabledDisabled } from '@/selects'
import { ipWithMask, port } from '@/validation/rules'

function ComputedStoreProperty (key) {
  this.get = function () {
    return this.$store.state.data[key]
  }
  this.set = function (value) {
    this.$store.commit('data/setValues', {
      [key]: value
    })
  }
}

export default {
  name: 'Script',
  mixins: [errors],
  data: () => ({
    enabledDisabled
  }),
  computed: {
    autoSetMAC: new ComputedStoreProperty('autoSetMAC'),
    autoStaticARP: new ComputedStoreProperty('autoStaticARP'),
    inNamespace: new ComputedStoreProperty('inNamespace'),
    ipBase: new ComputedStoreProperty('ipBase'),
    listenPortBase: new ComputedStoreProperty('listenPortBase'),
    script: new ComputedStoreProperty('script'),
    spawnTerminals: new ComputedStoreProperty('spawnTerminals')
  },
  validations: {
    listenPortBase: { port },
    ipBase: { ipWithMask }
  }
}
</script>

<style scoped>
</style>
