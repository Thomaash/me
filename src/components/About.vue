<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-card class="circle my-5">
        <img src="@/assets/icon.svg"/>
      </v-card>
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

export default {
  name: 'About',
  components: { DescriptionCard, LicenseCard }
}
</script>

<style scoped>
.circle {border-radius: 100%; margin: 0 auto; width: 100%; max-width: 20em;}
.circle img {width: 100%; height: 100%;}
</style>
