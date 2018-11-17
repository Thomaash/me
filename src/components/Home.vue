<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <Logo/>
      <v-flex xs12>
        <Description/>
      </v-flex>
      <v-flex xs12>
        <Bindings/>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Bindings from './Bindings'
import Description from './Description'
import Logo from './Logo'

export default {
  name: 'Home',
  components: { Bindings, Description, Logo }
}
</script>

<style scoped>
</style>
