<template>
  <v-slide-y-transition mode="out-in">
    <v-container grid-list-md>
      <v-layout wrap>
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
