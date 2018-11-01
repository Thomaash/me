<template>
  <v-layout row justify-center>
    <v-dialog v-model="dialog" persistent max-width="600px" @keydown.esc="cancel">
      <v-card>
        <v-card-title>
          <span class="headline" v-text="headline"/>
        </v-card-title>
        <div v-model="item" @valid="v => valid = v" :is="component"/>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" flat @click.native="cancel">Cancel</v-btn>
          <v-btn color="primary" flat @click.native="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import AssociationEdit from './Associtaion'
import ControllerEdit from './Controller'
import DummyEdit from './Dummy'
import HostEdit from './Host'
import LinkEdit from './Link'
import PortEdit from './Port'
import SwitchEdit from './Switch'

const typeComponentMap = {
  'association': 'AssociationEdit',
  'controller': 'ControllerEdit',
  'dummy': 'DummyEdit',
  'host': 'HostEdit',
  'link': 'LinkEdit',
  'port': 'PortEdit',
  'switch': 'SwitchEdit'
}
const typeHeadlineMap = {
  'association': 'Association',
  'controller': 'Controller',
  'dummy': 'Label',
  'host': 'Host',
  'link': 'Link',
  'port': 'Port',
  'switch': 'Switch'
}

export default {
  name: 'ItemEdit',
  components: { AssociationEdit, ControllerEdit, DummyEdit, HostEdit, LinkEdit, PortEdit, SwitchEdit },
  data: () => ({
    dialog: false,
    valid: false,
    component: 'HostEdit',
    headline: '',
    item: {}
  }),
  methods: {
    edit (item, callback) {
      const type = item.type
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
