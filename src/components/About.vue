<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <LogoCard/>
      <v-flex xs12>
        <DescriptionCard full/>
      </v-flex>
      <v-flex xs12>
        <LicenseCard/>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import DescriptionCard from './DescriptionCard'
import LicenseCard from './LicenseCard'
import LogoCard from './LogoCard'

export default {
  name: 'About',
  components: { DescriptionCard, LicenseCard, LogoCard }
}
</script>

<style scoped>
</style>
