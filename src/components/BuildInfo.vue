<template>
  <section>
    <h3 class="headline">Build</h3>

    <p>
      Build date: {{ buildDate }}
      <br>
      Commit date: {{ buildCommitDate }}
      <br>
      Commit hash:
      <a :href="'https://github.com/Thomaash/me/commit/' + buildCommitHash">
        {{ buildCommitHash }}
      </a>
    </p>
  </section>
</template>

<script>
export default {
  name: 'BuildInfo',
  computed: {
    buildDate () {
      return process.env.VUE_APP_BUILD_DATE
    },
    buildCommitHash () {
      return process.env.VUE_APP_BUILD_COMMIT_HASH
    },
    buildCommitDate () {
      return process.env.VUE_APP_BUILD_COMMIT_DATE
    }
  }
}
</script>
