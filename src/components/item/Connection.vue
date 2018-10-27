<template>
  <v-card-text>
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Label" required v-model="item.hostname"/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Bandwidth" required v-model="item.bandwidth"/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Delay" required v-model="item.delay"/>
        </v-flex>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Loss" required v-model="item.loss"/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card-text>
</template>

<script>
export default {
  name: 'ConnectionEdit',
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
