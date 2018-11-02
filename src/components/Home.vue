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
  'You can hold [ctrl] to select multiple items.',
  'You can long press a link or association to reconnect it.',
  'You can long press a switch or host to organize it\'s ports.',

  'You can press [a] to fit all items into the viewport.',
  'You can press [c] to add a controller.',
  'You can press [d] to delete selected items.',
  'You can press [delete] to delete selected items.',
  'You can press [e] to add an edge.',
  'You can press [f] to fit selected items into the viewport.',
  'You can press [h] to add a host.',
  'You can press [l] to add a label.',
  'You can press [p] to add a port.',
  'You can press [s] to add a switch.',

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
