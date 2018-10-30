<template>
  <v-card-text>
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Label" required v-model="item.hostname"/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card-text>
</template>

<script>
export default {
  name: 'AssociationEdit',
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
