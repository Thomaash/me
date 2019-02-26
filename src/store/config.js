import topology from './topology'
import persist from './persist'

export default {
  strict: process.env.NODE_ENV === 'development',
  state: {
    loading: true,
    working: false,
    alert: { show: false }
  },
  mutations: {
    setWorking (state, { working, curr, max }) {
      if (!isNaN(curr) && !isNaN(max)) {
        state.working = { curr, max }
      } else {
        state.working = !!working
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
}
