<template>
  <div class="w-100 h-100 pa-0">
    <LoadingSpinner v-if="appStore.loading" />
    <template v-else>
      <VisContainer ref="vis" @edit-item="editItem" />
      <Edit ref="edit" />
      <div class="position-fixed bottom-0 right-0 ma-4">
        <v-speed-dial
          v-if="!isView"
          v-model="fab"
          open-on-hover
          location="top center"
        >
          <template #activator="{ props: activatorProps }">
            <v-fab
              v-bind="activatorProps"
              size="large"
              color="primary"
              :icon="fab ? 'mdi-chevron-down' : 'mdi-chevron-up'"
              data-cy="fab-activator"
            ></v-fab>
          </template>
          <v-btn
            key="fab-edge"
            :color="theme.edge.menu"
            theme="dark"
            title="Edge"
            data-cy="fab-edge"
            icon="$net-edge"
            @click="vis.addEdge()"
          />
          <v-btn
            key="fab-port"
            :color="theme.port.menu"
            theme="dark"
            title="Port"
            data-cy="fab-port"
            icon="$net-port"
            @click="vis.addPort()"
          />
          <v-btn
            key="fab-host"
            :color="theme.host.menu"
            theme="dark"
            title="Host"
            data-cy="fab-host"
            icon="$net-host"
            @click="vis.addHost()"
          />
          <v-btn
            key="fab-switch"
            :color="theme.switch.menu"
            theme="dark"
            title="Switch"
            data-cy="fab-switch"
            icon="$net-switch"
            @click="vis.addSwitch()"
          />
          <v-btn
            key="fab-controller"
            :color="theme.controller.menu"
            theme="dark"
            title="Controller"
            data-cy="fab-controller"
            icon="$net-controller"
            @click="vis.addController()"
          />
          <v-btn
            key="fab-dummy"
            :color="theme.dummy.menu"
            theme="dark"
            title="Label"
            data-cy="fab-dummy"
            icon="$net-label"
            @click="vis.addDummy()"
          />
          <v-btn
            key="fab-delete"
            theme="dark"
            color="red"
            title="Delete"
            data-cy="fab-delete"
            icon="mdi-delete"
            @click="vis.deleteSelected()"
          />
        </v-speed-dial>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Edit from "@/components/Edit.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import VisContainer from "@/components/VisContainer.vue";
import { items as theme } from "@/theme";
import { useRoute } from "vue-router";
import { useAppStore } from "@/store/appStore";

const appStore = useAppStore();
const route = useRoute();

const vis = ref(null);
const edit = ref(null);
const fab = ref(false);
const isView = computed(() => route.meta?.isView);

function editItem(item, callback) {
  edit.value.edit(item, callback);
}
</script>
