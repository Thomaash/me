<template>
  <div class="canvas-container">
    <Vis ref="vis" @edit-item="editItem" />
    <Edit ref="edit" />
    <v-speed-dial v-model="fab" bottom right open-on-hover style="position: fixed">
      <v-btn slot="activator" v-model="fab" fab dark color="primary">
        <v-icon>mdi-chevron-up</v-icon>
        <v-icon>mdi-chevron-down</v-icon>
      </v-btn>
      <v-btn :color="theme.edge" fab dark small title="Edge" @click="$refs.vis.addEdge()">
        <v-icon>$vuetify.icons.net-edge</v-icon>
      </v-btn>
      <v-btn :color="theme.port" fab dark small title="Port" @click="$refs.vis.addPort()">
        <v-icon>$vuetify.icons.net-port</v-icon>
      </v-btn>
      <v-btn :color="theme.host" fab dark small title="Host" @click="$refs.vis.addHost()">
        <v-icon>$vuetify.icons.net-host</v-icon>
      </v-btn>
      <v-btn :color="theme.switch" fab dark small title="Switch" @click="$refs.vis.addSwitch()">
        <v-icon>$vuetify.icons.net-switch</v-icon>
      </v-btn>
      <v-btn :color="theme.controller" fab dark small title="Controller" @click="$refs.vis.addController()">
        <v-icon>$vuetify.icons.net-controller</v-icon>
      </v-btn>
      <v-btn :color="theme.dummy" fab dark small title="Label" @click="$refs.vis.addDummy()">
        <v-icon>$vuetify.icons.net-label</v-icon>
      </v-btn>
      <v-btn fab dark small color="red" title="Delete" @click="$refs.vis.deleteSelected()">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </v-speed-dial>
  </div>
</template>

<script>
import Edit from '@/components/item/Edit'
import Vis from '@/components/Vis'
import { items as theme } from '@/theme'

export default {
  name: 'Canvas',
  components: { Vis, Edit },
  data: () => ({
    fab: false,
    theme
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
