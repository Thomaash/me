<template>
  <v-layout wrap>
    <v-flex xs12 sm4>
      <v-btn
        :disabled="working"
        outlined
        block
        color="primary"
        data-cy="import-empty"
        @click="importData(emptyProject)"
      >
        Empty
      </v-btn>
    </v-flex>
    <v-flex xs12 sm4>
      <v-menu :disabled="working" bottom offset-y>
        <template #activator="{ on }">
          <v-btn :disabled="working" outlined block color="primary" v-on="on"
            >Examples</v-btn
          >
        </template>
        <v-list>
          <v-list-item
            v-for="(example, i) in examples"
            :key="'example' + i"
            @click.stop
          >
            <v-list-item-title
              @click="importData(example.data)"
              v-text="example.title"
            />
          </v-list-item>
        </v-list>
      </v-menu>
    </v-flex>
    <v-flex xs12 sm4>
      <v-btn
        :disabled="working"
        outlined
        block
        color="primary"
        @click="openFileChooser"
      >
        File
      </v-btn>
    </v-flex>

    <div style="height: 0px; width: 0px; overflow: hidden">
      <input
        ref="fileInput"
        :accept="importAccept"
        type="file"
        @input="retrieveFile"
        @change="retrieveFile"
      />
    </div>
  </v-layout>
</template>

<script>
import importScript from "@/importScript";
import scriptImportWarning from "./scriptImportWarning.txt";
import { mapGetters } from "vuex";

import exampleEmpty from "@/examples/empty";
import exampleMedium1C from "@/examples/medium_1_controller";
import exampleMedium2C from "@/examples/medium_2_controllers";
import exampleTiny from "@/examples/tiny";
import exampleTinyController from "@/examples/tiny_controller";
import exampleTinyMininetConf from "@/examples/tiny_mininet_conf";
import exampleTinyPhysicalInterface from "@/examples/tiny_physical_interface";
import exampleTinyTC from "@/examples/tiny_tc";

export default {
  name: "ImportSection",
  data: () => ({
    emptyProject: exampleEmpty,
    examples: [
      {
        title: "Tiny without controller",
        data: exampleTiny,
      },
      {
        title: "Tiny with controller",
        data: exampleTinyController,
      },
      {
        title: "Tiny with physical interface",
        data: exampleTinyPhysicalInterface,
      },
      {
        title: "Tiny with traffic control",
        data: exampleTinyTC,
      },
      {
        title: "Tiny with Mininet settings",
        data: exampleTinyMininetConf,
      },
      {
        title: "Medium with 1 controller",
        data: exampleMedium1C,
      },
      {
        title: "Medium with 2 controllers",
        data: exampleMedium2C,
      },
    ],
  }),
  computed: {
    ...mapGetters("topology", ["data"]),
    working: {
      get() {
        return !!this.$store.state.working;
      },
      set(value) {
        if (value) {
          this.$store.commit("clearAlert");
        }
        this.$store.commit("setWorking", { working: !!value });
      },
    },
    importers() {
      function json(json) {
        return { data: JSON.parse(json), log: [] };
      }
      function python(script) {
        return importScript(script);
      }
      return {
        ".json": json,
        ".py": python,
        "application/json": json,
        "application/x-python-code": python,
        "text/x-python": python,
        json,
        python,
      };
    },
    importAccept() {
      return Object.keys(this.importers)
        .filter((key) => /(^.|\/)/.test(key))
        .join(",");
    },
  },
  methods: {
    showAlert(type, text) {
      this.$store.commit("setAlert", { type, text });
    },
    openFileChooser() {
      const input = this.$refs.fileInput;
      input.click();
    },
    retrieveFile() {
      const input = this.$refs.fileInput;
      const file = input.files[0];
      input.value = "";

      // Some browsers emit input, some change and some both.
      // Return if the file was already collected by the other event handler.
      if (!file) {
        return;
      }

      this.working = true;

      const fr = new FileReader();
      fr.readAsBinaryString(file);
      fr.onloadend = async () => {
        try {
          const stringToImport =
            this.importers[file.type] ||
            this.importers[file.name.replace(/^.*(?=\.)/, "")];
          if (stringToImport) {
            const str = fr.result;
            const { data, log } = stringToImport(str);
            this.$emit("log", log);
            if (stringToImport === this.importers.python) {
              await this.confirmImport(data, scriptImportWarning);
            } else {
              await this.confirmImport(data);
            }
          } else {
            this.showAlert("error", `Unknown file format: “${file.type}”.`);
          }
        } catch (error) {
          console.error(error);
          this.showAlert("error", "Import failed.");
        } finally {
          this.working = false;
        }
      };
    },
    async importData(data) {
      this.working = true;
      await this.confirmImport(data);
      this.working = false;
    },
    async confirmImport(importData, text) {
      const confirmed = await this.$confirm(
        (text || "") +
          "<p>This will <strong>erase all your work</strong> (except what you have exported).<br/>Are you sure you want to continue?</p>",
        {
          buttonFalseText: "Keep existing project",
          buttonTrueText: "Import",
          icon: this.$vuetify.icons.warning,
          title: "Warning",
          width: 600,
        }
      );
      if (confirmed) {
        this.$store.commit("topology/importData", importData);
        this.showAlert("success", "Successfully imported.");
      } else {
        this.showAlert("info", "Import canceled.");
      }
    },
  },
};
</script>
