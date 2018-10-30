<template>
  <v-slide-y-transition mode="out-in">
    <v-container fluid>
      <v-layout column align-center>
        <blockquote v-text="hint"/>
      </v-layout>
    </v-container>
  </v-slide-y-transition>
</template>

<script>
const hints = [
  'You can double click any item to edit it\'s settings.',
  'You can hold ctrl key to select multiple items.',
  'You can long press a link or association to reconnect it.',
  'You can long press a switch or host to organize it\'s ports.',

  'First, solve the problem. Then, write the code.    — John Johnson'
]

export default {
  name: 'Home',
  data: () => ({
    hint: hints[hints.length - 1]
  }),
  methods: {
    randomHint () {
      this.hint = hints[Math.floor(Math.random() * hints.length)]
    }
  },
  mounted () {
    this.randomHint()
  }
}
</script>

<style scoped>
</style>
