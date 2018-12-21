<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex :class="{ 'pr-4': $vuetify.breakpoint.lgAndUp }" xs12 lg6>
        <v-layout wrap>
          <v-flex xs12>
            <v-select v-model="logLevel" :items="logLevels" label="Log Level" clearable />
          </v-flex>
          <v-flex xs12>
            <v-text-field v-model="ipBase" :error-messages="errors.ipBase" label="IP Base" clearable />
          </v-flex>
          <v-flex xs12>
            <v-text-field v-model.number="listenPortBase" :error-messages="errors.listenPortBase" label="Base Listening Port" type="number" min="1" max="65535" clearable />
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox v-model="autoSetMAC" label="Automatic MAC Addresses" />
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox v-model="autoStaticARP" label="Automatic Static ARP" />
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox v-model="inNamespace" label="In Namespace" />
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox v-model="spawnTerminals" label="Spawn Terminals" />
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex :class="{ 'pl-4': $vuetify.breakpoint.lgAndUp }" xs12 lg6>
        <v-layout wrap>
          <v-flex xs12>
            <v-textarea v-model="startScript" label="Startup Script" auto-grow />
          </v-flex>
          <v-flex xs12>
            <v-textarea v-model="stopScript" label="Shutdown Script" auto-grow />
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
  components: { ThreeStateCheckbox },
  mixins: [errors],
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
