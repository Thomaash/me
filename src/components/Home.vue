<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <Logo />
      <v-flex xs12>
        <Description />
      </v-flex>
      <v-flex xs12>
        <Bindings />
      </v-flex>
      <v-flex xs12>
        <Placeholders />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Bindings from './Bindings'
import Description from './Description'
import Logo from './Logo'
import Placeholders from './Placeholders'

export default {
  name: 'Home',
  components: { Bindings, Description, Logo, Placeholders }
}
</script>

<style scoped>
</style>
