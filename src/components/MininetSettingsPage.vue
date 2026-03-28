<template>
  <v-container grid-list-md>
    <LoadingSpinner v-if="loading !== false" />
    <template v-else>
      <v-row wrap>
        <v-col :class="{ 'pr-4': $vuetify.display.lgAndUp }" cols="12" lg="6">
          <v-row wrap>
            <v-col cols="12">
              <v-text-field
                v-model="projectName"
                clearable
                data-cy="mininet-settings-project-name"
                label="Project Name"
              />
            </v-col>
            <v-col cols="12" data-cy="mininet-settings-log-level">
              <v-select
                v-model="logLevel"
                :items="logLevels"
                clearable
                label="Log Level"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="ipBase"
                :rules="[validators.ipWithMask()]"
                clearable
                data-cy="mininet-settings-ip-base"
                label="IP Base"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model.number="listenPortBase"
                :rules="[validators.port()]"
                clearable
                data-cy="mininet-settings-listen-port-base"
                label="Base Listening Port"
                max="65535"
                min="1"
                type="number"
              />
            </v-col>
            <v-col cols="12">
              <ThreeStateCheckbox
                v-model="autoSetMAC"
                data-cy="mininet-settings-auto-set-mac"
                label="Automatic MAC Addresses"
              />
            </v-col>
            <v-col cols="12">
              <ThreeStateCheckbox
                v-model="autoStaticARP"
                data-cy="mininet-settings-auto-static-arp"
                label="Automatic Static ARP"
              />
            </v-col>
            <v-col cols="12">
              <ThreeStateCheckbox
                v-model="inNamespace"
                data-cy="mininet-settings-in-namespace"
                label="In Namespace"
              />
            </v-col>
            <v-col cols="12">
              <ThreeStateCheckbox
                v-model="spawnTerminals"
                data-cy="mininet-settings-spawn-terminals"
                label="Spawn Terminals"
              />
            </v-col>
          </v-row>
        </v-col>
        <v-col :class="{ 'pl-4': $vuetify.display.lgAndUp }" cols="12" lg="6">
          <v-row wrap>
            <v-col cols="12">
              <v-textarea
                v-model="startScript"
                auto-grow
                class="monospace-input"
                clearable
                data-cy="mininet-settings-start-script"
                label="Startup Script"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="stopScript"
                auto-grow
                class="monospace-input"
                clearable
                data-cy="mininet-settings-stop-script"
                label="Shutdown Script"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { computed } from "vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import ThreeStateCheckbox from "@/components/ThreeStateCheckbox.vue";
import { ipWithMask, port } from "@/validation/rules";
import { logLevels } from "@/components/selects";
import { useTopologyStore } from "@/composables/useTopologyStore";

const { loading, data, commitTopology } = useTopologyStore();

const validators = { ipWithMask, port };

const autoSetMAC = computed({
  get: () => data.value.autoSetMAC,
  set: (value) => commitTopology("setValues", { autoSetMAC: value }),
});
const autoStaticARP = computed({
  get: () => data.value.autoStaticARP,
  set: (value) => commitTopology("setValues", { autoStaticARP: value }),
});
const inNamespace = computed({
  get: () => data.value.inNamespace,
  set: (value) => commitTopology("setValues", { inNamespace: value }),
});
const ipBase = computed({
  get: () => data.value.ipBase,
  set: (value) => commitTopology("setValues", { ipBase: value }),
});
const listenPortBase = computed({
  get: () => data.value.listenPortBase,
  set: (value) => commitTopology("setValues", { listenPortBase: value }),
});
const logLevel = computed({
  get: () => data.value.logLevel,
  set: (value) => commitTopology("setValues", { logLevel: value }),
});
const projectName = computed({
  get: () => data.value.projectName,
  set: (value) => commitTopology("setValues", { projectName: value }),
});
const spawnTerminals = computed({
  get: () => data.value.spawnTerminals,
  set: (value) => commitTopology("setValues", { spawnTerminals: value }),
});
const startScript = computed({
  get: () => data.value.startScript,
  set: (value) => commitTopology("setValues", { startScript: value }),
});
const stopScript = computed({
  get: () => data.value.stopScript,
  set: (value) => commitTopology("setValues", { stopScript: value }),
});
</script>
