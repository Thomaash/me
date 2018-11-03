<template>
  <v-slide-y-transition mode="out-in">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-card>
            <v-card-title primary-title>
              <h3>Hints</h3>
            </v-card-title>
            <v-card-text>
              <blockquote v-text="hint"/>
            </v-card-text>
            <v-card-actions>
              <v-btn flat icon @click="nextHint(-1)"><v-icon>$vuetify.icons.prev</v-icon></v-btn>
              <v-btn flat icon @click="nextHint(1)"><v-icon>$vuetify.icons.next</v-icon></v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-slide-y-transition>
</template>

<script>
const hints = [
  // Mouse
  'You can double click any item to edit it\'s settings.',
  'You can hold [ctrl] to select multiple items.',
  'You can long press a link or association to reconnect it.',
  'You can long press a switch or host to organize it\'s ports.',

  // Keyboard
  'You can press [a] to fit all items into the viewport.',
  'You can press [c] to add a controller.',
  'You can press [d] to delete selected items.',
  'You can press [delete] to delete selected items.',
  'You can press [e] to add an edge.',
  'You can press [escape] to stop editing edges or adding items.',
  'You can press [f] to fit selected items into the viewport.',
  'You can press [h] to add a host.',
  'You can press [l] to add a label.',
  'You can press [p] to add a port.',
  'You can press [s] to add a switch.',

  // Other
  'First, solve the problem. Then, write the code.    — John Johnson'
]

export default {
  name: 'Home',
  data: () => ({
    hintIndex: Math.floor(Math.random() * hints.length)
  }),
  computed: {
    hint () {
      return hints[this.hintIndex]
    }
  },
  methods: {
    nextHint (diff) {
      while (diff < 0) {
        diff += hints.length
      }
      this.hintIndex = (this.hintIndex + diff) % hints.length
    }
  }
}
</script>

<style scoped>
</style>
