<template>
  <v-slide-y-transition mode="out-in">
    <div class="canvas-container">
      <Vis ref="vis" @edit-item="editItem"/>
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
        <v-btn fab dark small color="gray" @click="$refs.vis.addDummy()">
          <v-icon>label</v-icon>
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
