<template>
  <v-card class="circle my-5">
    <img src="@/assets/icon.svg" alt="Mininet Editor logo" />
  </v-card>
</template>

<script>
export default {
  name: "AppLogo",
};
</script>

<style scoped>
.circle {
  border-radius: 100% !important;
  margin: 0 auto;
  width: 100%;
  max-width: 20em;
}
.circle img {
  width: 100%;
  height: 100%;
}
</style>
