<template>
  <v-progress-circular
    :size="100"
    class="loading-spinner"
    color="primary"
    indeterminate
  />
</template>

<script>
export default {
  name: "LoadingSpinner",
};
</script>

<style scoped>
.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
