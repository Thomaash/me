<template>
  <v-slide-y-transition mode="out-in">
    <div class="canvas-container">
      <Vis ref="vis" @edit-item="editItem"/>
      <Edit ref="edit"/>
      <v-speed-dial v-model="fab" bottom right style="position: fixed" open-on-hover>
        <v-btn slot="activator" v-model="fab" color="accent" dark fab>
          <v-icon>mdi-chevron-up</v-icon>
          <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
        <v-btn fab dark small color="cyan" @click="$refs.vis.addEdge()">
          <v-icon>$vuetify.icons.net-edge</v-icon>
        </v-btn>
        <v-btn fab dark small color="orange" @click="$refs.vis.addPort()">
          <v-icon>$vuetify.icons.net-port</v-icon>
        </v-btn>
        <v-btn fab dark small color="green" @click="$refs.vis.addHost()">
          <v-icon>$vuetify.icons.net-host</v-icon>
        </v-btn>
        <v-btn fab dark small color="indigo" @click="$refs.vis.addSwitch()">
          <v-icon>$vuetify.icons.net-switch</v-icon>
        </v-btn>
        <v-btn fab dark small color="purple" @click="$refs.vis.addController()">
          <v-icon>$vuetify.icons.net-controller</v-icon>
        </v-btn>
        <v-btn fab dark small color="gray" @click="$refs.vis.addDummy()">
          <v-icon>$vuetify.icons.net-label</v-icon>
        </v-btn>
        <v-btn fab dark small color="red" @click="$refs.vis.deleteSelected()">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-speed-dial>
    </div>
  </v-slide-y-transition>
</template>

<script>
import Vis from '@/components/Vis'

import Edit from '@/components/item/Edit'

export default {
  name: 'Canvas',
  components: { Vis, Edit },
  data: () => ({
    fab: false
  }),
  methods: {
    editItem (item, callback) {
      this.$refs.edit.edit(item, callback)
    }
  }
}
</script>

<style scoped>
.canvas-container {width: 100%; height: 100%; padding: 0px;}
.invert-color {filter: invert(100%);}
</style>
