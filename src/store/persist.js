import VuexPersist from 'vuex-persist'
import exporter from '@/exporter'
import localForage from 'localforage'

import exampleData from '@/examples/medium_1_controller'

localForage.config({
  name: 'Vuex',
  version: 1.0,
  storeName: 'vuex'
})

export default new VuexPersist({
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
