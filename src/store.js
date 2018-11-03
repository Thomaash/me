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
