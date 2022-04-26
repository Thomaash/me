<template>
  <v-container grid-list-md>
    <LoadingSpinner v-if="loading !== false" />
    <template v-else>
      <v-layout wrap>
        <v-flex :class="{ 'pr-4': $vuetify.breakpoint.lgAndUp }" xs12 lg6>
          <v-layout wrap>
            <v-flex xs12>
              <v-text-field
                v-model="projectName"
                clearable
                data-cy="mininet-settings-project-name"
                label="Project Name"
              />
            </v-flex>
            <v-flex xs12 data-cy="mininet-settings-log-level">
              <v-select
                v-model="logLevel"
                :items="logLevels"
                clearable
                label="Log Level"
              />
            </v-flex>
            <v-flex xs12>
              <v-text-field
                v-model="ipBase"
                :error-messages="errors.ipBase"
                clearable
                data-cy="mininet-settings-ip-base"
                label="IP Base"
              />
            </v-flex>
            <v-flex xs12>
              <v-text-field
                ref="listenPortBase"
                v-model.number="listenPortBase"
                :rules="[badNumberRule('listenPortBase')]"
                :error-messages="errors.listenPortBase"
                clearable
                data-cy="mininet-settings-listen-port-base"
                label="Base Listening Port"
                max="65535"
                min="1"
                type="number"
              />
            </v-flex>
            <v-flex xs12>
              <ThreeStateCheckbox
                v-model="autoSetMAC"
                data-cy="mininet-settings-auto-set-mac"
                label="Automatic MAC Addresses"
              />
            </v-flex>
            <v-flex xs12>
              <ThreeStateCheckbox
                v-model="autoStaticARP"
                data-cy="mininet-settings-auto-static-arp"
                label="Automatic Static ARP"
              />
            </v-flex>
            <v-flex xs12>
              <ThreeStateCheckbox
                v-model="inNamespace"
                data-cy="mininet-settings-in-namespace"
                label="In Namespace"
              />
            </v-flex>
            <v-flex xs12>
              <ThreeStateCheckbox
                v-model="spawnTerminals"
                data-cy="mininet-settings-spawn-terminals"
                label="Spawn Terminals"
              />
            </v-flex>
          </v-layout>
        </v-flex>
        <v-flex :class="{ 'pl-4': $vuetify.breakpoint.lgAndUp }" xs12 lg6>
          <v-layout wrap>
            <v-flex xs12>
              <v-textarea
                v-model="startScript"
                auto-grow
                class="monospace-input"
                clearable
                data-cy="mininet-settings-start-script"
                label="Startup Script"
              />
            </v-flex>
            <v-flex xs12>
              <v-textarea
                v-model="stopScript"
                auto-grow
                class="monospace-input"
                clearable
                data-cy="mininet-settings-stop-script"
                label="Shutdown Script"
              />
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>
    </template>
  </v-container>
</template>

<script>
import LoadingSpinner from "@/components/LoadingSpinner";
import ThreeStateCheckbox from "@/components/ThreeStateCheckbox";
import errors from "@/validation/errors";
import { ipWithMask, port } from "@/validation/rules";
import { logLevels } from "@/components/selects";
import { mapGetters } from "vuex";

function ComputedStoreProperty(key) {
  this.get = function () {
    return this.data[key];
  };
  this.set = function (value) {
    this.$store.commit("topology/setValues", {
      [key]: value,
    });
  };
}

export default {
  name: "MininetSettiongsPage",
  components: { LoadingSpinner, ThreeStateCheckbox },
  mixins: [errors],
  data: () => ({
    logLevels,
  }),
  computed: {
    ...mapGetters("topology", ["data"]),
    loading() {
      return this.$store.state.loading;
    },
    autoSetMAC: new ComputedStoreProperty("autoSetMAC"),
    autoStaticARP: new ComputedStoreProperty("autoStaticARP"),
    inNamespace: new ComputedStoreProperty("inNamespace"),
    ipBase: new ComputedStoreProperty("ipBase"),
    listenPortBase: new ComputedStoreProperty("listenPortBase"),
    logLevel: new ComputedStoreProperty("logLevel"),
    projectName: new ComputedStoreProperty("projectName"),
    spawnTerminals: new ComputedStoreProperty("spawnTerminals"),
    startScript: new ComputedStoreProperty("startScript"),
    stopScript: new ComputedStoreProperty("stopScript"),
  },
  validations: {
    listenPortBase: { port },
    ipBase: { ipWithMask },
  },
};
</script>
