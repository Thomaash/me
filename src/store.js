import Vue from 'vue'
import Vuex from 'vuex'

import exampleData from './store.example'

Vue.use(Vuex)

const data = {
  namespaced: true,
  state: exampleData,
  mutations: {
    setItem (state, {id, item}) {
      state.items[id] = item
    },
    updateItem (state, item) {
      const saved = state.items[item.id]
      Object.keys(item).forEach(key => {
        if (key !== 'id') {
          saved[key] = item[key]
        }
      })
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
