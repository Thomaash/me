<template>
  <section>
    <h3 class="text-h6">Description</h3>

    <p>SDN topology editor in your web browser with Mininet export.</p>

    <p>
      Exports JSONs (whole projects), Python scripts (Mininet emulation),
      addressing plans and topology images.
      <br />
      Imports JSONs and Python scripts.
      <br />
      Persists projects even if the browser is closed and also works offline.
    </p>

    <p v-if="full">
      <v-btn
        class="ma-2"
        variant="outlined"
        color="primary"
        target="_blank"
        href="https://github.com/Thomaash/me"
      >
        Repository
      </v-btn>
      <v-btn
        class="ma-2"
        variant="outlined"
        color="primary"
        target="_blank"
        href="https://github.com/Thomaash/me/issues/new"
      >
        New Issue
      </v-btn>
    </p>
  </section>
</template>

<script setup>
defineOptions({ name: "AppDescription" });

defineProps({
  full: {
    type: Boolean,
    default: false,
  },
});
</script>
