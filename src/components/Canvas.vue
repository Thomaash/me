<template>
  <v-slide-y-transition mode="out-in">
    <div class="canvas-container">
      <Vis ref="vis" @edit-item="editItem"/>
      <Edit ref="edit"/>
      <v-speed-dial v-model="fab" bottom right open-on-hover style="position: fixed">
        <v-btn fab dark color="accent" slot="activator" v-model="fab">
          <v-icon>mdi-chevron-up</v-icon>
          <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
        <v-btn fab dark small :color="theme.edge" @click="$refs.vis.addEdge()">
          <v-icon>$vuetify.icons.net-edge</v-icon>
        </v-btn>
        <v-btn fab dark small :color="theme.port" @click="$refs.vis.addPort()">
          <v-icon>$vuetify.icons.net-port</v-icon>
        </v-btn>
        <v-btn fab dark small :color="theme.host" @click="$refs.vis.addHost()">
          <v-icon>$vuetify.icons.net-host</v-icon>
        </v-btn>
        <v-btn fab dark small :color="theme.switch" @click="$refs.vis.addSwitch()">
          <v-icon>$vuetify.icons.net-switch</v-icon>
        </v-btn>
        <v-btn fab dark small :color="theme.controller" @click="$refs.vis.addController()">
          <v-icon>$vuetify.icons.net-controller</v-icon>
        </v-btn>
        <v-btn fab dark small :color="theme.dummy" @click="$refs.vis.addDummy()">
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
