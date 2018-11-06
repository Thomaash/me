<template>
  <v-slide-y-transition mode="out-in">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-card>
            <v-card-title primary-title>
              <h3>Introduction</h3>
            </v-card-title>
            <v-card-text>
              GUI topology editor for Mininet with Python script export.
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex xs12>
          <BindingsCard/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-slide-y-transition>
</template>

<script>
import BindingsCard from './BindingsCard'

export default {
  name: 'Home',
  components: { BindingsCard }
}
</script>

<style scoped>
</style>
