<template>
  <v-card class="circle rounded-circle mx-auto w-100 my-5">
    <img src="@/assets/icon.svg" alt="Mininet Editor logo" />
  </v-card>
</template>

<script setup>
defineOptions({ name: "AppLogo" });
</script>

<style scoped>
.circle {
  max-width: 20em;
}
.circle img {
  width: 100%;
  height: 100%;
}
</style>
