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
    <v-toolbar color="primary" dark app extension-height="7">
      <v-toolbar-side-icon @click.stop="drawer = !drawer"/>
      <v-toolbar-title v-text="title"/>
      <v-spacer/>
      <v-progress-linear
        v-show="progress.show"
        :indeterminate="progress.indeterminate === true"
        :value="progress.value"
        class="ma-0"
        slot="extension"
        color="accent"
      />
    </v-toolbar>
    <v-content>
      <v-alert v-model="alertShow" dismissible :type="alertData.type" class="mt-0" transition="slide-y-transition">
        {{ alertData.text }}
      </v-alert>
      <v-slide-y-transition mode="out-in">
        <router-view/>
      </v-slide-y-transition>
    </v-content>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
    drawer: true,
    alertShow: false,
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
  }),
  computed: {
    progress () {
      const working = this.$store.state.working
      return {
        show: !!working,
        indeterminate: working === true,
        value: working.curr != null && working.max != null
          ? working.curr / working.max * 100
          : 0
      }
    },
    alertData () {
      const alert = this.$store.state.alert
      this.alertShow = !!alert
      if (alert) {
        return alert
      } else {
        return {}
      }
    }
  }
}
</script>

<style>
html::-webkit-scrollbar {width: 0px !important;}

section {margin-bottom: 3em;}
section > h1,
section > h2,
section > h3,
section > h4,
section > h5,
section > h6
{margin-bottom: 16px;}

.v-toolbar__extension {padding: 0px;}
</style>
