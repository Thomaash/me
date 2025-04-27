export default {
  props: ["modelValue"],
  emits: ["update:modelValue", "new-item", "valid"],
  data: () => ({
    valid: false,
    item: {},
    _lastItem: null,
  }),
  watch: {
    item(val) {
      this._newItemEmit();
      this.$emit("update:modelValue", val);
    },
    modelValue(val) {
      this.item = val;
    },
    valid(val) {
      this.$emit("valid", val);
    },
  },
  methods: {
    _newItemEmit() {
      if (this.item === this._lastItem) {
        return;
      }

      this._lastItem = this.item;
      this.$emit("new-item", this.item);
    },
  },
  mounted() {
    this.item = this.modelValue;
    this._newItemEmit();
    this.$emit("valid", this.valid);
    if (this.$v) {
      this.$v.$touch();
    }
  },
};
