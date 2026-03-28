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

    <p v-if="isUpdateAvailable">
      A new version is available and will be automatically installed when you
      close all open tabs.
    </p>
  </section>
</template>

<script setup>
defineOptions({ name: "BuildInfo" });

import { useTopologyStore } from "@/composables/useTopologyStore";

const { isUpdateAvailable } = useTopologyStore();

const buildDate = import.meta.env.VITE_BUILD_DATE;
const buildCommitHash = import.meta.env.VITE_BUILD_COMMIT_HASH;
const buildCommitDate = import.meta.env.VITE_BUILD_COMMIT_DATE;
</script>
