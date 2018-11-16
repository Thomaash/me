<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" persistent enable-resize-watcher fixed app>
      <v-list>
        <v-list-tile value="true" v-for="(item, i) in items" :key="i" :to="item.to">
          <v-list-tile-action>
            <v-icon v-html="item.icon"/>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title v-text="item.title"/>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar color="primary" dark app>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"/>
      <v-toolbar-title v-text="title"/>
      <v-spacer/>
    </v-toolbar>
    <v-content>
      <v-slide-y-transition mode="out-in">
        <router-view/>
      </v-slide-y-transition>
    </v-content>
  </v-app>
</template>

<script>
export default {
  data () {
    return {
      drawer: true,
      items: [{
        icon: 'mdi-home',
        title: 'Home',
        to: '/'
      }, {
        icon: 'mdi-map',
        title: 'Canvas',
        to: '/canvas'
      }, {
        icon: 'mdi-script',
        title: 'Startup Script',
        to: '/script'
      }, {
        icon: 'mdi-content-save',
        title: 'Export/Import',
        to: '/export'
      }, {
        icon: 'mdi-information',
        title: 'About',
        to: '/about'
      }],
      title: 'Mininet Editor'
    }
  },
  name: 'App'
}
</script>

<style>
html::-webkit-scrollbar {width: 0px !important;}
</style>
