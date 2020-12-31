<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <Logo />
      <v-flex xs12>
        <Description full />
      </v-flex>
      <v-flex xs12>
        <License />
      </v-flex>
      <v-flex xs12>
        <BuildInfo />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import BuildInfo from './BuildInfo'
import Description from './Description'
import License from './License'
import Logo from './Logo'

export default {
  name: 'About',
  components: { BuildInfo, Description, License, Logo }
}
</script>

<style scoped>
</style>
