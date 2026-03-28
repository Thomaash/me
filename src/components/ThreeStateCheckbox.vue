<template>
  <v-checkbox
    :title="state.title"
    :label="label"
    :model-value="state.value === true"
    :indeterminate="state.value === undefined"
    :color="color"
    readonly
    class="text-primary"
    true-icon="$checkboxTrue"
    false-icon="$checkboxFalse"
    indeterminate-icon="$checkboxUndefined"
    @click="cycle"
  />
</template>

<script setup>
defineOptions({ name: "ThreeStateCheckbox" });

import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: undefined,
  },
  color: {
    type: String,
    default: "primary",
  },
  label: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const states = [
  { value: undefined, title: "Default" },
  { value: true, title: "Enabled" },
  { value: false, title: "Disabled" },
].map((value, index) => ({ ...value, index }));

const state = computed(() => {
  return states.find(({ value }) => value === props.modelValue) || states[0];
});

function cycle() {
  const curr = state.value.index;
  const next = (curr + 1) % states.length;
  emit("update:modelValue", states[next].value);
}
</script>
