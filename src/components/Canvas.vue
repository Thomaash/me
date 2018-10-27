<template>
  <v-slide-y-transition mode="out-in">
    <div class="canvas-container">
      <Vis ref="vis"
        @edit-connection="editConnection"
        @edit-controller="editController"
        @edit-port="editPort"
        @edit-host="editHost"
        @edit-switch="editSwitch"
      />
      <Edit ref="edit"/>
      <v-speed-dial v-model="fab" bottom right style="position: fixed" open-on-hover>
        <v-btn slot="activator" v-model="fab" color="accent" dark fab>
          <v-icon>expand_less</v-icon>
          <v-icon>expand_more</v-icon>
        </v-btn>
        <v-btn fab dark small color="cyan" @click="$refs.vis.addConnection()">
          <v-icon>link</v-icon>
        </v-btn>
        <v-btn fab dark small color="orange" @click="$refs.vis.addPort()">
          <v-icon>radio_button_unchecked</v-icon>
        </v-btn>
        <v-btn fab dark small color="green" @click="$refs.vis.addHost()">
          <v-icon>computer</v-icon>
        </v-btn>
        <v-btn fab dark small color="indigo" @click="$refs.vis.addSwitch()">
          <v-icon>router</v-icon>
        </v-btn>
        <v-btn fab dark small color="purple" @click="$refs.vis.addController()">
          <v-icon>developer_board</v-icon>
        </v-btn>
        <v-btn fab dark small color="red" @click="$refs.vis.deleteSelected()">
          <v-icon>delete</v-icon>
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
  components: {Vis, Edit},
  data: () => ({
    fab: false
  }),
  methods: {
    editConnection (data, callback) {
      this.$refs.edit.edit('connection', data, callback)
    },
    editController (data, callback) {
      this.$refs.edit.edit('controller', data, callback)
    },
    editHost (data, callback) {
      this.$refs.edit.edit('host', data, callback)
    },
    editPort (data, callback) {
      this.$refs.edit.edit('port', data, callback)
    },
    editSwitch (data, callback) {
      this.$refs.edit.edit('switch', data, callback)
    }
  }
}
</script>

<style scoped>
.canvas-container {width: 100%; height: 100%; padding: 0px;}
.invert-color {filter: invert(100%);}
</style>
