<template>
  <v-layout row justify-center>
    <v-dialog
      v-model="dialog"
      persistent
      scrollable
      max-width="600px"
      :fullscreen="$vuetify.breakpoint.xsOnly"
      @keydown.esc="cancel"
      @keydown.enter="save"
    >
      <v-card>
        <v-card-title primary-title style="flex-grow: 0;">
          <v-icon v-text="'$vuetify.icons.net-' + themeType" class="mr-2"/>
          <h3 class="headline" v-text="headline"/>
        </v-card-title>
        <v-card-text style="flex-grow: 1;">
          <div v-model="item" @valid="v => valid = v" :is="component"/>
        </v-card-text>
        <v-card-actions style="flex-grow: 0;">
          <v-spacer/>
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
    item: {}
  }),
  computed: {
    component () {
      return typeComponentMap[this.item.type] || 'div'
    },
    headline () {
      return typeHeadlineMap[this.item.type] || ''
    },
    themeType () {
      switch (this.item.type) {
        case 'association':
        case 'link':
          return 'edge'
        default:
          return this.item.type
      }
    }
  },
  methods: {
    edit (item, callback) {
      this.item = JSON.parse(JSON.stringify(item))
      this.callback = callback

      this.dialog = true
    },
    save () {
      const item = JSON.parse(JSON.stringify(this.item))
      this.callback(item)
      this.close()
    },
    cancel () {
      this.callback()
      this.close()
    },
    close () {
      this.item = {}
      this.callback = null
      this.dialog = false
    }
  }
}
</script>

<style scoped>
</style>
