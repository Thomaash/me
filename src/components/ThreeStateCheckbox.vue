<template>
  <v-checkbox
    readonly
    class="primary--text"
    :title="state.title"
    :label="label"
    :input-value="state.value === true"
    :indeterminate="state.value === false"
    :color="color"
    on-icon="$vuetify.icons.checkboxTrue"
    off-icon="$vuetify.icons.checkboxUndefined"
    indeterminate-icon="$vuetify.icons.checkboxFalse"
    @click="cycle"
  />
</template>

<script>
export default {
  props: {
    value: Boolean,
    color: {
      type: String,
      default: 'primary'
    },
    label: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    states: [
      { value: undefined, title: 'Default' },
      { value: true, title: 'Enabled' },
      { value: false, title: 'Disabled' }
    ].map((value, index) => ({ ...value, index }))
  }),
  computed: {
    state () {
      return this.states.find(({ value }) => value === this.value) || this.states[0]
    }
  },
  methods: {
    cycle () {
      const curr = this.state.index
      const next = curr >= 0
        ? (curr + 1) % this.states.length
        : 0
      this.$emit('input', this.states[next].value)
    }
  }
}
</script>

<style scoped>
</style>
