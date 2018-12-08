<template>
  <v-menu bottom offset-y>
    <v-btn v-show="show" dark icon slot="activator"><v-icon>mdi-dots-vertical</v-icon></v-btn>
    <v-list>
      <v-list-tile v-for="({ icon, text, action }, i) in items" :key="'canvas_toolbar_' + i" @click="">
        <v-list-tile-avatar @click="action">
          <v-icon v-text="icon"/>
        </v-list-tile-avatar>
        <v-list-tile-title v-text="text" @click="action"/>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'CanvasToolbar',
  data: () => ({
    rawItems: [{
      icon: 'mdi-undo',
      text: 'Undo',
      action: 'undo',
      test: 'canUndo'
    }, {
      icon: 'mdi-redo',
      text: 'Redo',
      action: 'redo',
      test: 'canRedo'
    }]
  }),
  computed: {
    ...mapGetters('topology', [ 'canUndo', 'canRedo' ]),
    show () {
      return !!this.items.length
    },
    items () {
      return this.rawItems.filter(raw => this[raw.test]).map(raw => ({
        ...raw,
        action: this[raw.action]
      }))
    }
  },
  methods: {
    undo () {
      this.$store.dispatch('topology/undo')
    },
    redo () {
      this.$store.dispatch('topology/redo')
    }
  }
}
</script>
