<template>
  <section>
    <h3 class="headline">License</h3>

    <p v-for="(part, i) in license" :key="'license_p_' + i" v-text="part" />
  </section>
</template>

<script>
import license from "@/../LICENSE";

export default {
  name: "AppLicense",
  computed: {
    license() {
      return license.split(/\n\n/g);
    },
  },
};
</script>
