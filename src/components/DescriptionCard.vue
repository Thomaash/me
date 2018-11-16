<template>
  <v-card>
    <v-card-title primary-title>
      <h3 class="headline">Description</h3>
    </v-card-title>

    <v-card-text>
      GUI topology editor for Mininet with Python script export.
    </v-card-text>

    <v-card-actions v-if="full">
      <v-btn flat color="primary" target="_blank" href="https://github.com/Thomaash/me">
        Repository
      </v-btn>
      <v-btn flat color="primary" target="_blank" href="https://github.com/Thomaash/me/issues/new">
        New Issue
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'Description',
  props: {
    full: Boolean
  }
}
</script>
