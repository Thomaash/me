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
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>
export default {
  data () {
    return {
      drawer: true,
      items: [{
        icon: 'home',
        title: 'Home',
        to: '/'
      }, {
        icon: 'map',
        title: 'Canvas',
        to: '/canvas'
      }, {
        icon: 'save',
        title: 'Export/Import',
        to: '/export'
      }, {
        icon: 'info',
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
