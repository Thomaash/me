<template>
  <div class="canvas-container">
    <LoadingSpinner v-if="loading !== false" />
    <template v-else>
      <VisContainer ref="vis" @edit-item="editItem" />
      <Edit ref="edit" />
      <div style="position: fixed; right: 1em; bottom: 1em">
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
            @click="$refs.vis.addEdge()"
          />
          <v-btn
            key="fab-port"
            :color="theme.port.menu"
            theme="dark"
            title="Port"
            data-cy="fab-port"
            icon="$net-port"
            @click="$refs.vis.addPort()"
          />
          <v-btn
            key="fab-host"
            :color="theme.host.menu"
            theme="dark"
            title="Host"
            data-cy="fab-host"
            icon="$net-host"
            @click="$refs.vis.addHost()"
          />
          <v-btn
            key="fab-switch"
            :color="theme.switch.menu"
            theme="dark"
            title="Switch"
            data-cy="fab-switch"
            icon="$net-switch"
            @click="$refs.vis.addSwitch()"
          />
          <v-btn
            key="fab-controller"
            :color="theme.controller.menu"
            theme="dark"
            title="Controller"
            data-cy="fab-controller"
            icon="$net-controller"
            @click="$refs.vis.addController()"
          />
          <v-btn
            key="fab-dummy"
            :color="theme.dummy.menu"
            theme="dark"
            title="Label"
            data-cy="fab-dummy"
            icon="$net-label"
            @click="$refs.vis.addDummy()"
          />
          <v-btn
            key="fab-delete"
            theme="dark"
            color="red"
            title="Delete"
            data-cy="fab-delete"
            icon="mdi-delete"
            @click="$refs.vis.deleteSelected()"
          />
        </v-speed-dial>
      </div>
    </template>
  </div>
</template>

<script>
import Edit from "@/components/Edit.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import VisContainer from "@/components/VisContainer.vue";
import { items as theme } from "@/theme";

export default {
  name: "CanvasPage",
  components: { Edit, LoadingSpinner, VisContainer },
  data: () => ({
    fab: false,
    theme,
  }),
  computed: {
    loading() {
      return this.$store.state.loading;
    },
    isView() {
      return this.$route.meta.isView;
    },
  },
  methods: {
    editItem(item, callback) {
      this.$refs.edit.edit(item, callback);
    },
  },
};
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  padding: 0px;
}
.invert-color {
  filter: invert(100%);
}
</style>
