<template>
  <section>
    <h3 class="headline">Build</h3>

    <p>
      Build date: {{ buildDate }}
      <br />
      Commit date: {{ buildCommitDate }}
      <br />
      Commit hash: {{ buildCommitHash }}
      <br />
      <v-btn
        class="ma-2"
        variant="outlined"
        color="primary"
        target="_blank"
        :href="'https://github.com/Thomaash/me/commit/' + buildCommitHash"
      >
        Open on GitHub
      </v-btn>
    </p>

    <p v-if="$store.state.isUpdateAvailable">
      A new version is available and will be automatically installed when you
      close all open tabs.
    </p>
  </section>
</template>

<script>
export default {
  name: "BuildInfo",
  computed: {
    buildDate() {
      return process.env.VITE_BUILD_DATE;
    },
    buildCommitHash() {
      return process.env.VITE_BUILD_COMMIT_HASH;
    },
    buildCommitDate() {
      return process.env.VITE_BUILD_COMMIT_DATE;
    },
  },
};
</script>
