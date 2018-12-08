import Vue from 'vue'
import Vuex from 'vuex'

import topology from './topology'
import persist from './persist'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV === 'development',
  state: {
    loading: true,
    working: false,
    alert: { show: false }
  },
  mutations: {
    setWorking (state, { working, curr, max }) {
      state.working = !!working
      if (!isNaN(curr) && !isNaN(max)) {
        state.working = { curr, max }
      }
    },
    setAlert (state, { type, text }) {
      state.alert = { show: true, type, text }
    },
    clearAlert (state) {
      state.alert.show = false
    }
  },
  actions: {},
  modules: {
    topology
  },
  plugins: [persist.plugin]
})
