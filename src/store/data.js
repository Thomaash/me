import Vue from 'vue'
import exporter from '@/exporter'

import emptyData from '@/examples/empty'

export default {
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
