<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row wrap>
        <v-col cols="12">
          <v-text-field
            v-model="item.hostname"
            label="Label"
            autofocus
            clearable
            data-cy="edit-hostname"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup>
import { ref, watch } from "vue";

const item = defineModel({ type: Object, required: true });
const valid = ref(false);
const emit = defineEmits(["valid"]);

watch(valid, (val) => emit("valid", val));
</script>
