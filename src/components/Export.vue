<template>
  <v-slide-y-transition mode="out-in">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-textarea xs12 label="Export" v-model="json" rows="40"/>
      </v-layout>
    </v-container>
  </v-slide-y-transition>
</template>

<script>
export default {
  name: 'Export',
  data: () => ({
    json: '{}'
  }),
  mounted () {
    this.json = JSON.stringify(this.$store.state.data, undefined, 4)
  }
}
</script>

<style scoped>
</style>
