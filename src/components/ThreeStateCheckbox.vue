<template>
  <v-checkbox
    :title="state.title"
    :label="label"
    :input-value="state.value === true"
    :indeterminate="state.value === undefined"
    :color="color"
    readonly
    class="primary--text"
    on-icon="$vuetify.icons.checkboxTrue"
    off-icon="$vuetify.icons.checkboxFalse"
    indeterminate-icon="$vuetify.icons.checkboxUndefined"
    @click="cycle"
  />
</template>

<script>
export default {
  props: {
    value: {
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
        this.states.find(({ value }) => value === this.value) || this.states[0]
      );
    },
  },
  methods: {
    cycle() {
      const curr = this.state.index;
      const next = (curr + 1) % this.states.length;
      this.$emit("input", this.states[next].value);
    },
  },
};
</script>
