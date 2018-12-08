import VuexPersist from 'vuex-persist'
import exporter from '@/exporter'
import localForage from 'localforage'

import exampleData from '@/examples/medium_1_controller'

localForage.config({
  name: 'Vuex',
  version: 1.0,
  storeName: 'vuex-me'
})

export default new VuexPersist({
  storage: localForage,
  asyncStorage: true,
  strictMode: false,
  reducer: state => ({ topology: state.topology }),
  async saveState (key, state, storage) {
    return storage.setItem(key, {
      topology: {
        data: exporter.exportData(state.topology.data),
        past: state.topology.past,
        future: state.topology.future
      }
    })
  },
  async restoreState (key, storage) {
    const state = await storage.getItem(key)
    if (state && state.topology && state.topology.data && state.topology.data.items && Array.isArray(state.topology.data.items)) {
      return {
        loading: false,
        topology: {
          data: exporter.importData(state.topology.data),
          past: state.topology.past || [],
          future: state.topology.future || []
        }
      }
    } else {
      return {
        loading: false,
        topology: {
          data: exporter.importData(exampleData),
          past: [],
          future: []
        }
      }
    }
  }
})
