import Vue from 'vue'
import Vuex from 'vuex'

import exampleData from './store.example'

Vue.use(Vuex)

const data = {
  namespaced: true,
  state: exampleData,
  mutations: {
    setItem (state, item) {
      if (item.id == null) {
        throw new Error('Items have to have ids.')
      }
      state.items[item.id] = item
    },
    updateItem (state, item) {
      const saved = state.items[item.id]
      Object.keys(item).forEach(key => {
        saved[key] = item[key]
      })
    },
    setScript (state, script) {
      if (script && script !== '') {
        state.script = script
      } else {
        delete state.script
      }
    },
    removeItems (state, ids) {
      ids.forEach(id => delete state.items[id])
    }
  }
}

export default new Vuex.Store({
  strict: true,
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    data
  }
})
