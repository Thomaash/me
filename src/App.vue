<template>
  <v-app>
    <template v-if="isView !== true">
      <v-app-bar color="primary" dark app extension-height="7">
        <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
        <v-toolbar-title style="font-weight: 300; font-size: 24px; letter-spacing: unset;" v-text="appName" />

        <v-spacer />

        <v-slide-y-transition mode="out-in">
          <router-view name="toolbar" />
        </v-slide-y-transition>

        <v-progress-linear
          v-show="progress.show"
          slot="extension"
          :indeterminate="progress.indeterminate === true"
          :value="progress.value"
          class="ma-0"
          color="accent"
        />

        <v-alert
          slot="extension"
          v-model="showAlert"
          :type="alert.type"
          dismissible
          class="mt-0 alert"
          transition="slide-y-transition"
        >
          {{ alert.text }}
        </v-alert>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer" persistent enable-resize-watcher fixed app>
        <v-list>
          <v-list-item v-for="(item, i) in drawerItems" :key="i" :to="item.to" :data-cy="`drawer-${item.to.name.toLowerCase().replace(' ', '-')}`" value="true" color="primary">
            <v-list-item-action>
              <v-icon v-html="item.icon" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title v-text="item.title" />
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    </template>

    <v-main>
      <v-slide-y-transition mode="out-in">
        <router-view />
      </v-slide-y-transition>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
    drawer: true,
    appName: 'Mininet Editor'
  }),
  computed: {
    documentTitle () {
      const { title, subtitle } = this.$route.meta
      const subtitleStr = subtitle ? subtitle(this.$route) : ''
      return `${this.appName} | ${title}${subtitleStr}`
    },
    drawerItems () {
      return this.$router.options.routes
        .filter(route => route.meta && route.meta.drawer)
        .map(({ name, meta }) => ({
          title: meta.title,
          icon: meta.icon,
          to: { name }
        }))
    },
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
    alert () {
      return this.$store.state.alert
    },
    showAlert: {
      get () {
        return this.alert.show
      },
      set (value) {
        if (value === false) {
          this.$store.commit('clearAlert')
        }
      }
    },
    isView () {
      return this.$route.meta.isView
    }
  },
  watch: {
    documentTitle: {
      handler (to) {
        this.updateDocumentTitle()
      },
      deep: true
    }
  },
  mounted () {
    this.updateDocumentTitle()
  },
  methods: {
    updateDocumentTitle () {
      document.title = this.documentTitle
    }
  }
}
</script>

<style>
html::-webkit-scrollbar {
  width: 0px !important;
}
::selection {
  background: #80CBC4;
}

section {
  margin-bottom: 3em;
}
section > h1,
section > h2,
section > h3,
section > h4,
section > h5,
section > h6 {
  margin-bottom: 16px;
}

.monospace {
  font-family: 'Source Code Pro', monospace !important;
}
kbd {
  font-family: 'Source Code Pro', monospace !important;
  font-weight: normal;
}
.monospace-input input,
.monospace-input textarea {
  font-family: 'Source Code Pro', monospace !important;
}

.v-toolbar__extension {
  position: relative;
  padding: 0px;
}
</style>

<style scoped>
.alert {
  position: absolute;
  top: 7px;
  left: 0px;
  right: 0px;
  z-index: -1;
}
</style>
