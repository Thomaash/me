<template>
  <div>
    <v-btn
      v-for="({ icon, text, action, enabled }, i) in items"
      :key="i"
      :disabled="!enabled"
      dark
      icon
      @click="action"
    >
      <v-icon :alt="text">{{ icon }}</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "TopologyToolbar",
  props: {
    undoRedo: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters("topology", ["canUndo", "canRedo"]),
    show() {
      return !!this.items.length;
    },
    viewURL() {
      return this.$route.name.startsWith("Canvas")
        ? `/view${this.$route.fullPath}`
        : "/view/canvas";
    },
    items() {
      return [
        {
          icon: "mdi-undo",
          text: "Undo",
          action: () => {
            this.$store.dispatch("topology/undo");
          },
          show: this.undoRedo,
          enabled: this.canUndo,
        },
        {
          icon: "mdi-redo",
          text: "Redo",
          action: () => {
            this.$store.dispatch("topology/redo");
          },
          show: this.undoRedo,
          enabled: this.canRedo,
        },
        {
          icon: "mdi-open-in-new",
          text: "Open a new view",
          action: this.openViewPopup,
          show: true,
          enabled: true,
        },
      ].filter(({ show }) => show);
    },
  },
  methods: {
    openViewPopup() {
      window.open(
        `${this.$router.mode === "hash" ? "#" : ""}${this.viewURL}`,
        "",
        "_blank"
      );
    },
  },
};
</script>
