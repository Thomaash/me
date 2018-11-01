export default {
  props: ['value'],
  data: () => ({
    valid: false,
    item: {}
  }),
  watch: {
    item (val) {
      this.$emit('input', val)
    },
    value (val) {
      this.item = val
    },
    valid (val) {
      this.$emit('valid', val)
    }
  },
  mounted () {
    this.item = this.value
    this.$emit('valid', this.valid)
    if (this.$v) {
      this.$v.$touch()
    }
  }
}
