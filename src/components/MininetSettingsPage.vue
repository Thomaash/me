<template>
  <v-container grid-list-md>
    <LoadingSpinner v-if="appStore.loading !== false" />
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
import { useTopologyStore } from "@/store/topologyStore";
import { useAppStore } from "@/store/appStore";

const topologyStore = useTopologyStore();
const appStore = useAppStore();

const validators = { ipWithMask, port };

const autoSetMAC = computed({
  get: () => topologyStore.data.autoSetMAC,
  set: (value) => topologyStore.setValues({ autoSetMAC: value }),
});
const autoStaticARP = computed({
  get: () => topologyStore.data.autoStaticARP,
  set: (value) => topologyStore.setValues({ autoStaticARP: value }),
});
const inNamespace = computed({
  get: () => topologyStore.data.inNamespace,
  set: (value) => topologyStore.setValues({ inNamespace: value }),
});
const ipBase = computed({
  get: () => topologyStore.data.ipBase,
  set: (value) => topologyStore.setValues({ ipBase: value }),
});
const listenPortBase = computed({
  get: () => topologyStore.data.listenPortBase,
  set: (value) => topologyStore.setValues({ listenPortBase: value }),
});
const logLevel = computed({
  get: () => topologyStore.data.logLevel,
  set: (value) => topologyStore.setValues({ logLevel: value }),
});
const projectName = computed({
  get: () => topologyStore.data.projectName,
  set: (value) => topologyStore.setValues({ projectName: value }),
});
const spawnTerminals = computed({
  get: () => topologyStore.data.spawnTerminals,
  set: (value) => topologyStore.setValues({ spawnTerminals: value }),
});
const startScript = computed({
  get: () => topologyStore.data.startScript,
  set: (value) => topologyStore.setValues({ startScript: value }),
});
const stopScript = computed({
  get: () => topologyStore.data.stopScript,
  set: (value) => topologyStore.setValues({ stopScript: value }),
});
</script>
