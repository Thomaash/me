<template>
  <v-row justify="center">
    <v-dialog
      v-model="dialog"
      :fullscreen="fullscreen || xs"
      persistent
      scrollable
      max-width="600px"
      @keydown.esc="cancel"
      @keydown.enter="save"
    >
      <v-card :data-cy="`edit-${item.type}`">
        <v-card-title style="flex-grow: 0" @dblclick="fullscreen = !fullscreen">
          <v-icon class="mr-2">{{ `$net-${themeType}` }}</v-icon>
          <h3 class="text-h6" v-text="headline" />
        </v-card-title>
        <v-card-text style="flex-grow: 1">
          <component
            :is="component"
            v-model="item"
            @valid="(v) => (valid = v)"
          />
        </v-card-text>
        <v-card-actions style="flex-grow: 0">
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            data-cy="edit-cancel"
            @click="cancel"
            >Cancel</v-btn
          >
          <v-btn
            :disabled="!valid"
            color="primary"
            variant="text"
            data-cy="edit-save"
            @click="save"
            >Save</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDisplay } from "vuetify";

import AssociationEdit from "./edit/Association.vue";
import ControllerEdit from "./edit/Controller.vue";
import DummyEdit from "./edit/Dummy.vue";
import HostEdit from "./edit/Host.vue";
import LinkEdit from "./edit/Link.vue";
import PortEdit from "./edit/Port.vue";
import SwitchEdit from "./edit/Switch.vue";

const typeComponentMap = {
  association: AssociationEdit,
  controller: ControllerEdit,
  dummy: DummyEdit,
  host: HostEdit,
  link: LinkEdit,
  port: PortEdit,
  switch: SwitchEdit,
};

const typeHeadlineMap = {
  association: "Association",
  controller: "Controller",
  dummy: "Label",
  host: "Host",
  link: "Link",
  port: "Port",
  switch: "Switch",
};

const { xs } = useDisplay();

const dialog = ref(false);
const fullscreen = ref(true);
const item = ref({});
const valid = ref(false);

let callback = null;

const component = computed(() => typeComponentMap[item.value.type] || "div");
const headline = computed(() => typeHeadlineMap[item.value.type] || "");
const themeType = computed(() => {
  switch (item.value.type) {
    case "association":
    case "link":
      return "edge";
    default:
      return item.value.type;
  }
});

function edit(editItem, editCallback) {
  item.value = JSON.parse(JSON.stringify(editItem));
  callback = editCallback;
  fullscreen.value = false;
  dialog.value = true;
}

function save(event) {
  if (event.target.tagName === "TEXTAREA") {
    return;
  }

  if (!valid.value) {
    return;
  }

  const savedItem = JSON.parse(JSON.stringify(item.value));
  callback(savedItem);
  close();
}

function cancel() {
  callback();
  close();
}

function close() {
  item.value = {};
  callback = null;
  dialog.value = false;
}

defineExpose({ edit });
</script>
