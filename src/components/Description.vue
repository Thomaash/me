<template>
  <section>
    <h3 class="headline">Description</h3>

    <p>
      GUI topology editor for Mininet with Python script export.
    </p>

    <p v-if="full">
      <v-btn outline color="primary" target="_blank" href="https://github.com/Thomaash/me">
        Repository
      </v-btn>
      <v-btn outline color="primary" target="_blank" href="https://github.com/Thomaash/me/issues/new">
        New Issue
      </v-btn>
    </p>
  </section>
</template>

<script>
export default {
  name: 'Description',
  props: {
    full: Boolean
  }
}
</script>
