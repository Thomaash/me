<template>
  <v-layout row justify-center>
    <v-dialog
      v-model="dialog"
      :fullscreen="fullscreen || $vuetify.breakpoint.xsOnly"
      persistent
      scrollable
      max-width="600px"
      @keydown.esc="cancel"
      @keydown.enter="save"
    >
      <v-card :data-cy="`edit-${item.type}`">
        <v-card-title
          primary-title
          style="flex-grow: 0"
          @dblclick="fullscreen = !fullscreen"
        >
          <v-icon class="mr-2" v-text="'$vuetify.icons.net-' + themeType" />
          <h3 class="headline" v-text="headline" />
        </v-card-title>
        <v-card-text style="flex-grow: 1">
          <div :is="component" v-model="item" @valid="(v) => (valid = v)" />
        </v-card-text>
        <v-card-actions style="flex-grow: 0">
          <v-spacer />
          <v-btn
            color="primary"
            text
            data-cy="edit-cancel"
            @click.native="cancel"
            >Cancel</v-btn
          >
          <v-btn
            :disabled="!valid"
            color="primary"
            text
            data-cy="edit-save"
            @click.native="save"
            >Save</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import AssociationEdit from "./edit/Associtaion";
import ControllerEdit from "./edit/Controller";
import DummyEdit from "./edit/Dummy";
import HostEdit from "./edit/Host";
import LinkEdit from "./edit/Link";
import PortEdit from "./edit/Port";
import SwitchEdit from "./edit/Switch";

const typeComponentMap = {
  association: "AssociationEdit",
  controller: "ControllerEdit",
  dummy: "DummyEdit",
  host: "HostEdit",
  link: "LinkEdit",
  port: "PortEdit",
  switch: "SwitchEdit",
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

export default {
  name: "ItemEdit",
  components: {
    AssociationEdit,
    ControllerEdit,
    DummyEdit,
    HostEdit,
    LinkEdit,
    PortEdit,
    SwitchEdit,
  },
  data: () => ({
    dialog: false,
    fullscreen: true,
    item: {},
    valid: false,
  }),
  computed: {
    component() {
      return typeComponentMap[this.item.type] || "div";
    },
    headline() {
      return typeHeadlineMap[this.item.type] || "";
    },
    themeType() {
      switch (this.item.type) {
        case "association":
        case "link":
          return "edge";
        default:
          return this.item.type;
      }
    },
  },
  methods: {
    edit(item, callback) {
      this.item = JSON.parse(JSON.stringify(item));
      this.callback = callback;

      this.fullscreen = false;
      this.dialog = true;
    },
    save() {
      if (!this.valid) {
        return;
      }

      const item = JSON.parse(JSON.stringify(this.item));
      this.callback(item);
      this.close();
    },
    cancel() {
      this.callback();
      this.close();
    },
    close() {
      this.item = {};
      this.callback = null;
      this.dialog = false;
    },
  },
};
</script>
