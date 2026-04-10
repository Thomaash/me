<template>
  <v-list-item data-cy="save-indicator" :data-state="saveState" :ripple="false">
    <template #prepend>
      <v-progress-circular
        v-if="saveState === 'saving'"
        indeterminate
        :size="20"
        :width="2"
      />
      <v-icon v-else :color="iconColor">{{ iconName }}</v-icon>
    </template>
    <v-list-item-title>{{ label }}</v-list-item-title>
  </v-list-item>
</template>

<script setup>
import { computed } from "vue";
import { useAppStore } from "@/store/appStore";

defineOptions({ name: "SaveIndicator" });

const appStore = useAppStore();
const saveState = computed(() => appStore.saveState);

const iconName = computed(() => {
  switch (saveState.value) {
    case "pending": {
      return "mdi-cloud-clock-outline";
    }
    case "error": {
      return "mdi-cloud-alert";
    }
    default: {
      return "mdi-cloud-check";
    }
  }
});

const iconColor = computed(() => {
  switch (saveState.value) {
    case "pending": {
      return undefined;
    }
    case "error": {
      return "warning";
    }
    default: {
      return "grey-lighten-1";
    }
  }
});

const label = computed(() => {
  switch (saveState.value) {
    case "pending": {
      return "Unsaved changes";
    }
    case "saving": {
      return "Saving…";
    }
    case "error": {
      return "Save failed";
    }
    default: {
      return "All changes saved";
    }
  }
});
</script>
