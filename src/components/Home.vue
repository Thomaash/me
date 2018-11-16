<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <LogoCard/>
      <v-flex xs12>
        <DescriptionCard/>
      </v-flex>
      <v-flex xs12>
        <BindingsCard/>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import BindingsCard from './BindingsCard'
import DescriptionCard from './DescriptionCard'
import LogoCard from './LogoCard'

export default {
  name: 'Home',
  components: { BindingsCard, DescriptionCard, LogoCard }
}
</script>

<style scoped>
</style>
