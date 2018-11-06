<template>
  <v-slide-y-transition mode="out-in">
    <v-container grid-list-md fill-height>
      <v-layout wrap>
        <v-flex xs12>
          <v-card>
            <v-card-text>
              <v-textarea label="Script" v-model="script" auto-grow/>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-slide-y-transition>
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
