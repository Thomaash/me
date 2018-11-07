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
      const data = exporter.importData(importData)
      Object.keys(data).forEach(key =>
        Vue.set(state, key, data[key])
      )
    },
    setItem (state, item) {
      if (item.id == null) {
        throw new Error('Items have to have ids.')
      }
      Vue.set(state.items, item.id, item)
    },
    updateItem (state, item) {
      const saved = state.items[item.id]
      Object.keys(item).forEach(key => {
        Vue.set(saved, key, item[key])
      })
    },
    setScript (state, script) {
      if (script && script !== '') {
        Vue.set(state, 'script', script)
      } else {
        Vue.delete(state, 'script')
      }
    },
    removeItems (state, ids) {
      ids.forEach(id => Vue.delete(state.items, id))
    }
  }
}

export default new Vuex.Store({
  state: {
    loading: true
  },
  mutations: {
  },
  actions: {},
  modules: {
    data
  },
  plugins: [vuexPersist.plugin]
})
