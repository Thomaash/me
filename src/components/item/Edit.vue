<template>
  <v-layout row justify-center>
    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline" v-text="headline"/>
        </v-card-title>
        <div v-model="item" :is="component"/>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" flat @click.native="cancel">Cancel</v-btn>
          <v-btn color="primary" flat @click.native="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import ConnectionEdit from './Connection'
import ControllerEdit from './Controller'
import HostEdit from './Host'
import PortEdit from './Port'
import SwitchEdit from './Switch'

const typeComponentMap = {
  'connection': 'ConnectionEdit',
  'controller': 'ControllerEdit',
  'host': 'HostEdit',
  'port': 'PortEdit',
  'switch': 'SwitchEdit'
}
const typeHeadlineMap = {
  'connection': 'Connection',
  'controller': 'Controller',
  'host': 'Host',
  'port': 'Port',
  'switch': 'Switch'
}

export default {
  name: 'ItemEdit',
  components: {ConnectionEdit, ControllerEdit, HostEdit, PortEdit, SwitchEdit},
  data: () => ({
    dialog: false,
    component: 'HostEdit',
    headline: '',
    item: {}
  }),
  methods: {
    edit (type, item, callback) {
      this.component = typeComponentMap[type]
      this.headline = typeHeadlineMap[type]
      this.item = JSON.parse(JSON.stringify(item))
      this.callback = callback

      this.dialog = true
    },
    save () {
      const item = JSON.parse(JSON.stringify(this.item))
      this.callback(item)

      this.item = {}
      this.callback = null

      this.dialog = false
    },
    cancel () {
      this.callback()
      this.callback = null
      this.dialog = false
    }
  }
}
</script>

<style scoped>
</style>
