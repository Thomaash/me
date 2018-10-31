<template>
  <v-card-text>
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Label" required v-model="item.hostname"/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Bandwidth" v-model.number="item.bandwidth" min="0" suffix="MBits/s" clearable/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Delay" v-model.number="item.delay" min="0" suffix="ms" clearable/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Loss" v-model.number="item.loss" min="0" max="100" suffix="%" clearable/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Max queue" v-model.number="item.maxQueueSize" min="0" suffix="packets" clearable/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Jitter" v-model.number="item.jitter" min="0" suffix="ms" clearable/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card-text>
</template>

<script>
export default {
  name: 'LinkEdit',
  props: ['value'],
  data: () => ({
    dialog: false,
    item: {}
  }),
  watch: {
    item (val) {
      this.$emit('input', val)
    },
    value (val) {
      this.item = val
    }
  },
  mounted () {
    this.item = this.value
  }
}
</script>

<style scoped>
</style>
