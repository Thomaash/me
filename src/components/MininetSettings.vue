<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex xs12 lg6 :class="{ 'pr-4': $vuetify.breakpoint.lgAndUp }">
        <v-layout wrap>
          <v-flex xs12>
            <v-select label="Log Level" :items="logLevels" v-model="logLevel" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-text-field label="IP Base" v-model="ipBase" :error-messages="errors.ipBase" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-text-field label="Base Listening Port" v-model.number="listenPortBase" type="number" min="1" max="65535" :error-messages="errors.listenPortBase" clearable/>
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox label="Automatic MAC Addresses" v-model="autoSetMAC"/>
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox label="Automatic Static ARP" v-model="autoStaticARP"/>
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox label="In Namespace" v-model="inNamespace"/>
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox label="Spawn Terminals" v-model="spawnTerminals"/>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex xs12 lg6 :class="{ 'pl-4': $vuetify.breakpoint.lgAndUp }">
        <v-layout wrap>
          <v-flex xs12>
            <v-textarea label="Startup Script" v-model="startScript" auto-grow/>
          </v-flex>
          <v-flex xs12>
            <v-textarea label="Shutdown Script" v-model="stopScript" auto-grow/>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import ThreeStateCheckbox from '@/components/ThreeStateCheckbox'
import errors from '@/validation/errors'
import { ipWithMask, port } from '@/validation/rules'
import { logLevels } from '@/selects'
import { mapGetters } from 'vuex'

function ComputedStoreProperty (key) {
  this.get = function () {
    return this.data[key]
  }
  this.set = function (value) {
    this.$store.commit('topology/setValues', {
      [key]: value
    })
  }
}

export default {
  name: 'Script',
  mixins: [errors],
  components: { ThreeStateCheckbox },
  data: () => ({
    logLevels
  }),
  computed: {
    ...mapGetters('topology', [
      'data'
    ]),
    autoSetMAC: new ComputedStoreProperty('autoSetMAC'),
    autoStaticARP: new ComputedStoreProperty('autoStaticARP'),
    inNamespace: new ComputedStoreProperty('inNamespace'),
    ipBase: new ComputedStoreProperty('ipBase'),
    listenPortBase: new ComputedStoreProperty('listenPortBase'),
    logLevel: new ComputedStoreProperty('logLevel'),
    spawnTerminals: new ComputedStoreProperty('spawnTerminals'),
    startScript: new ComputedStoreProperty('startScript'),
    stopScript: new ComputedStoreProperty('stopScript')
  },
  validations: {
    listenPortBase: { port },
    ipBase: { ipWithMask }
  }
}
</script>

<style scoped>
</style>
