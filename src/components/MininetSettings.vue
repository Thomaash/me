<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex :class="{ 'pr-4': $vuetify.breakpoint.lgAndUp }" xs12 lg6>
        <v-layout wrap>
          <v-flex xs12>
            <v-text-field v-model="projectName" label="Project Name" clearable data-cy="mininet-settings-project-name" />
          </v-flex>
          <v-flex xs12 data-cy="mininet-settings-log-level">
            <v-select v-model="logLevel" :items="logLevels" label="Log Level" clearable />
          </v-flex>
          <v-flex xs12>
            <v-text-field v-model="ipBase" :error-messages="errors.ipBase" label="IP Base" clearable data-cy="mininet-settings-ip-base" />
          </v-flex>
          <v-flex xs12>
            <v-text-field v-model.number="listenPortBase" :error-messages="errors.listenPortBase" label="Base Listening Port" type="number" min="1" max="65535" clearable data-cy="mininet-settings-listen-port-base" />
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox v-model="autoSetMAC" label="Automatic MAC Addresses" data-cy="mininet-settings-auto-set-mac" />
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox v-model="autoStaticARP" label="Automatic Static ARP" data-cy="mininet-settings-auto-static-arp" />
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox v-model="inNamespace" label="In Namespace" data-cy="mininet-settings-in-namespace" />
          </v-flex>
          <v-flex xs12>
            <ThreeStateCheckbox v-model="spawnTerminals" label="Spawn Terminals" data-cy="mininet-settings-spawn-terminals" />
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex :class="{ 'pl-4': $vuetify.breakpoint.lgAndUp }" xs12 lg6>
        <v-layout wrap>
          <v-flex xs12>
            <v-textarea v-model="startScript" label="Startup Script" auto-grow clearable data-cy="mininet-settings-start-script" />
          </v-flex>
          <v-flex xs12>
            <v-textarea v-model="stopScript" label="Shutdown Script" auto-grow clearable data-cy="mininet-settings-stop-script" />
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
import { logLevels } from '@/components/selects'
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
    projectName: new ComputedStoreProperty('projectName'),
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
