<template>
  <section>
    <h3 class="headline">License</h3>

    <p v-for="(part, i) in licenseParts" :key="'license_p_' + i" v-text="part" />
  </section>
</template>

<script setup>
defineOptions({ name: "AppLicense" });

import { computed } from "vue";
import license from "@/../LICENSE?raw";

const licenseParts = computed(() => license.split(/\n\n/g));
</script>
