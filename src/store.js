import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'
import exporter from '@/exporter'
import localForage from 'localforage'

import exampleData from '@/examples/medium_1_controller'
import emptyData from '@/examples/empty'

Vue.use(Vuex)

localForage.config({
  name: 'Vuex',
  version: 1.0,
  storeName: 'vuex'
})

const vuexPersist = new VuexPersist({
  storage: localForage,
  asyncStorage: true,
  strictMode: false,
  reducer: state => ({ data: state.data }),
  async saveState (key, state, storage) {
    return storage.setItem(key, {
      data: exporter.exportData(state.data)
    })
  },
  async restoreState (key, storage) {
    const state = await storage.getItem(key)
    if (!state || !state.data || !state.data.items || !Array.isArray(state.data.items)) {
      return {
        loading: false,
        data: exporter.importData(exampleData)
      }
    } else {
      return {
        loading: false,
        data: exporter.importData(state.data)
      }
    }
  }
})

const data = {
  namespaced: true,
  state: exporter.importData(emptyData),
  mutations: {
    importData (state, importData) {
      // Clean old data
      Object.keys(state).forEach(key => {
        Vue.delete(state, key)
      })

      // Load new data
      const data = exporter.importData(importData)
      Object.keys(data).forEach(key =>
        Vue.set(state, key, data[key])
      )
    },
    setItems (state, items) {
      items.forEach(item => {
        if (item.id == null) {
          throw new Error('Items have to have ids.')
        }
        Vue.set(state.items, item.id, item)
      })
    },
    updateItems (state, items) {
      items.forEach(item => {
        const saved = state.items[item.id]
        Object.keys(item).forEach(key => {
          Vue.set(saved, key, item[key])
        })
      })
    },
    setValues (state, data) {
      Object.keys(data).forEach(key => {
        const value = data[key]
        if (value != null && value !== '') {
          Vue.set(state, key, value)
        } else {
          Vue.delete(state, key)
        }
      })
    },
    removeItems (state, ids) {
      ids.forEach(id => Vue.delete(state.items, id))
    }
  }
}

export default new Vuex.Store({
  state: {
    loading: true,
    working: false,
    alert: null
  },
  mutations: {
    setWorking (state, { working, curr, max }) {
      state.working = !!working
      if (!isNaN(curr) && !isNaN(max)) {
        state.working = { curr, max }
      }
    },
    setAlert (state, { type, text }) {
      state.alert = { type, text }
    },
    clearAlert (state) {
      state.alert = null
    }
  },
  actions: {},
  modules: {
    data
  },
  plugins: [vuexPersist.plugin]
})
