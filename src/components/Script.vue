<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex xs12>
        <v-textarea label="Script" v-model="script" auto-grow/>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  name: 'Script',
  data: () => ({
  }),
  computed: {
    script: {
      get () {
        return this.$store.state.data.script
      },
      set (script) {
        this.$store.commit('data/setScript', script)
      }
    }
  }
}
</script>

<style scoped>
</style>
