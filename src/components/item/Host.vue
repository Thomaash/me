<template>
  <v-card-text>
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Hostname" required v-model="item.hostname"/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Default Route" required v-model="item.defaultRoute"/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card-text>
</template>

<script>
export default {
  name: 'HostEdit',
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
