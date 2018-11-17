<template>
  <section>
    <h3 class="headline">License</h3>

    <p v-for="part in license" v-text="part"/>
  </section>
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
