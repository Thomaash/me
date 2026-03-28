<template>
  <div>
    <v-btn
      v-for="({ icon, text, action, enabled }, i) in items"
      :key="i"
      :disabled="!enabled"
      theme="dark"
      icon
      @click="action"
    >
      <v-icon :alt="text">{{ icon }}</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { useTopologyStore } from "@/composables/useTopologyStore";

const props = defineProps({
  undoRedo: {
    type: Boolean,
    default: false,
  },
});

const store = useStore();
const route = useRoute();
const router = useRouter();
const { canUndo, canRedo } = useTopologyStore();

const viewURL = computed(() =>
  route.name.startsWith("Canvas") ? `/view${route.fullPath}` : "/view/canvas",
);

function openViewPopup() {
  window.open(router.options.history.createHref(viewURL.value), "", "_blank");
}

const items = computed(() =>
  [
    {
      icon: "mdi-undo",
      text: "Undo",
      action: () => store.dispatch("topology/undo"),
      show: props.undoRedo,
      enabled: canUndo.value,
    },
    {
      icon: "mdi-redo",
      text: "Redo",
      action: () => store.dispatch("topology/redo"),
      show: props.undoRedo,
      enabled: canRedo.value,
    },
    {
      icon: "mdi-open-in-new",
      text: "Open a new view",
      action: openViewPopup,
      show: true,
      enabled: true,
    },
  ].filter(({ show }) => show),
);

const show = computed(() => !!items.value.length);
</script>
