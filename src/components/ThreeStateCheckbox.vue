<template>
  <v-checkbox
    :title="state.title"
    :label="label"
    :model-value="state.value === true"
    :indeterminate="state.value === undefined"
    :color="color"
    readonly
    class="primary--text"
    true-icon="$checkboxTrue"
    false-icon="$checkboxFalse"
    indeterminate-icon="$checkboxUndefined"
    @click="cycle"
  />
</template>

<script>
export default {
  props: {
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
  },
  emits: ["update:modelValue"],
  data: () => ({
    states: [
      { value: undefined, title: "Default" },
      { value: true, title: "Enabled" },
      { value: false, title: "Disabled" },
    ].map((value, index) => ({ ...value, index })),
  }),
  computed: {
    state() {
      return (
        this.states.find(({ value }) => value === this.modelValue) ||
        this.states[0]
      );
    },
  },
  methods: {
    cycle() {
      const curr = this.state.index;
      const next = (curr + 1) % this.states.length;
      this.$emit("update:modelValue", this.states[next].value);
    },
  },
};
</script>
