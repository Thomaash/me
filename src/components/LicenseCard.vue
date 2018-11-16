<template>
  <v-card>
    <v-card-title primary-title>
      <h3 class="headline">License</h3>
    </v-card-title>
    <v-card-text>
      <p v-for="part in license" v-text="part"/>
    </v-card-text>
  </v-card>
</template>

<script>
import license from '@/../LICENSE'

export default {
  name: 'License',
  computed: {
    license () {
      return license.split(/\n\n/g)
    }
  }
}
</script>
