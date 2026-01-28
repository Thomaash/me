<template>
  <div class="canvas-container">
    <LoadingSpinner v-if="loading !== false" />
    <template v-else>
      <VisContainer ref="vis" @edit-item="editItem" />
      <Edit ref="edit" />
      <!-- Save/Load buttons in top right -->
      <div style="position: fixed; right: 5em; bottom: 1.5em; display: flex; gap: 0.5em">
        <v-btn
          color="primary"
          variant="outlined"
          @click="loadDialogOpen = true"
          data-cy="config-load"
        >
          List
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="saveDialogOpen = true"
          data-cy="config-save"
        >
          Save
        </v-btn>
      </div>
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
      <!-- Save dialog -->
      <v-dialog v-model="saveDialogOpen" max-width="400">
        <v-card>
          <v-card-title>Save Configuration</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="projectName"
              label="Project Name"
              variant="outlined"
              placeholder="Enter project name"
              data-cy="save-project-name-input"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              @click="saveDialogOpen = false"
              data-cy="save-cancel-btn"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="handleSave"
              data-cy="save-confirm-btn"
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <!-- Load dialog -->
      <v-dialog v-model="loadDialogOpen" max-width="500">
        <v-card>
          <v-card-title>Load Configuration</v-card-title>
          <v-card-text>
            <div v-if="loadingConfigs" class="text-center pa-4">
              <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <div v-else-if="configsList.length === 0" class="text-center pa-4 text-grey">
              No saved configurations
            </div>
            <v-list v-else>
              <v-list-item
                v-for="config in configsList"
                :key="config.name"
                data-cy="config-item"
              >
                <template #prepend>
                  <v-btn
                    size="small"
                    color="primary"
                    variant="elevated"
                    @click="handleLoadConfig(config.name)"
                    data-cy="config-import-btn"
                    class="config-import-btn"
                  >
                    Import
                  </v-btn>
                </template>
                <div class="config-info">
                  <div class="font-weight-bold">{{ config.name }}</div>
                  <div class="text-caption text-grey">
                    {{ new Date(config.createdAt).toLocaleDateString() }}
                    {{ new Date(config.createdAt).toLocaleTimeString() }}
                  </div>
                </div>
                <template #append>
                  <v-btn
                    size="small"
                    color="error"
                    variant="text"
                    icon="mdi-delete"
                    @click="handleDeleteConfig(config.name)"
                    data-cy="config-delete-btn"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              @click="loadDialogOpen = false"
              data-cy="load-cancel-btn"
            >
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script>
import Edit from "@/components/Edit.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import VisContainer from "@/components/VisContainer.vue";
import { items as theme } from "@/theme";
import exporter from "@/exporter";
import { mapGetters } from "vuex";

export default {
  name: "CanvasPage",
  components: { Edit, LoadingSpinner, VisContainer },
  data: () => ({
    fab: false,
    theme,
    saveDialogOpen: false,
    loadDialogOpen: false,
    projectName: "",
    configsList: [],
    loadingConfigs: false,
  }),
  computed: {
    ...mapGetters("topology", ["data"]),
    loading() {
      return this.$store.state.loading;
    },
    isView() {
      return this.$route.meta.isView;
    },
  },
  watch: {
    saveDialogOpen(newVal) {
      if (newVal) {
        // Set default value to current topology's projectName
        this.projectName = this.data.projectName || "";
      }
    },
    loadDialogOpen(newVal) {
      if (newVal) {
        this.fetchConfigs();
      }
    },
  },
  methods: {
    editItem(item, callback) {
      this.$refs.edit.edit(item, callback);
    },
    async handleSave() {
      if (!this.projectName.trim()) {
        this.$store.commit("setAlert", { type: "error", text: "Project name is required" });
        return;
      }

      try {
        const token = this.$store.state.auth.token;
        if (!token) {
          this.$store.commit("setAlert", { type: "warning", text: "Please login to save configurations" });
          return;
        }

        // Export data using the same exporter as ExportSection
        const exportedData = exporter.exportData(this.data);
        
        // Remove projectName from exported data to avoid overwriting user input
        const { projectName: _, ...dataWithoutProjectName } = exportedData;
        
        const res = await fetch( "https://apidabirgress.runflare.run" + "/api/configs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectName: this.projectName,
            ...dataWithoutProjectName,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to save config");
        }

        console.log("Config saved successfully");
        this.projectName = "";
        this.saveDialogOpen = false;
      } catch (err) {
        console.error("Error saving config:", err);
      }
    },
    async fetchConfigs() {
      this.loadingConfigs = true;
      try {
        const token = this.$store.state.auth.token;
        if (!token) {
          this.$store.commit("setAlert", { type: "warning", text: "Please login to load configurations" });
          return;
        }

        const res = await fetch( "https://apidabirgress.runflare.run" + "/api/configs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch configs");
        }

        const data = await res.json();
        this.configsList = data.configs || [];
      } catch (err) {
        console.error("Error fetching configs:", err);
        this.configsList = [];
      } finally {
        this.loadingConfigs = false;
      }
    },
    async handleLoadConfig(configName) {
      try {
        const token = this.$store.state.auth.token;
        if (!token) {
          this.$store.commit("setAlert", { type: "warning", text: "Please login to load configurations" });
          return;
        }

        // Fetch only the specific config by name
        const res = await fetch("https://apidabirgress.runflare.run" + `/api/configs/${encodeURIComponent(configName)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch config");
        }

        const data = await res.json();
        const config = data.config;

        // Parse the content if it's a string
        let importData = typeof config.content === "string" 
          ? JSON.parse(config.content) 
          : config.content;

        // Ensure version field exists (default to 0 if missing)
        if (importData.version === undefined) {
          console.warn("Version field missing in config, setting to 0");
          importData.version = 0;
        }

        // Pass to store - it will call exporter.importData() internally
        this.$store.commit("topology/importData", importData);

        console.log("Config loaded successfully");
        this.loadDialogOpen = false;
      } catch (err) {
        console.error("Error loading config:", err);
      }
    },
    async handleDeleteConfig(configName) {
      try {
        const token = this.$store.state.auth.token;
        if (!token) {
          this.$store.commit("setAlert", { type: "warning", text: "Please login to delete configurations" });
          return;
        }

        const res = await fetch("https://apidabirgress.runflare.run" + `/api/configs/${encodeURIComponent(configName)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to delete config");
        }

        console.log("Config deleted successfully");
        // Refresh the configs list
        await this.fetchConfigs();
      } catch (err) {
        console.error("Error deleting config:", err);
      }
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
.config-info {
  flex: 1;
  min-width: 0;
}
.config-import-btn {
  flex-shrink: 0;
  margin-right: 0.5rem;
}
</style>
