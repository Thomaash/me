import VuexPersist from 'vuex-persist'
import exporter from '@/exporter'
import localForage from 'localforage'

import exampleData from '@/examples/medium_1_controller'

localForage.config({
  name: 'Vuex',
  version: 1.0,
  storeName: 'vuex-me'
})

let saveTimeout = null
let saving = 0

// Don't let the user leave the page as long as one or more changes are being saved.
window.addEventListener('beforeunload', e => {
  if (saving) {
    e.preventDefault()
    e.returnValue = ''
  }
})

export default new VuexPersist({
  storage: localForage,
  asyncStorage: true,
  strictMode: false,
  filter: ({ type }) => type.startsWith('topology/'),
  reducer: state => ({ topology: state.topology }),
  saveState (key, state, storage) {
    if (saveTimeout != null) {
      window.clearTimeout(saveTimeout)
    } else {
      ++saving
    }

    saveTimeout = window.setTimeout(() => {
      saveTimeout = null
      ;(async () => {
        await storage.setItem(key, {
          topology: {
            data: exporter.exportData(state.topology.data),
            past: state.topology.past,
            future: state.topology.future
          }
        })
        --saving
      })()
    }, 2000)
  },
  async restoreState (key, storage) {
    const state = await storage.getItem(key)
    if (
      state &&
      state.topology &&
      state.topology.data &&
      state.topology.data.items &&
      Array.isArray(state.topology.data.items)
    ) {
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
