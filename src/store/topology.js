import Vue from 'vue'
import exporter from '@/exporter'

import emptyData from '@/examples/empty'

function prepareUndoRedoChange (changeLogItem) {
  const change = {
    remove: [],
    replace: []
  }

  changeLogItem.map(({ before: beforeJSON, after: afterJSON }) => {
    const before = JSON.parse(afterJSON)
    const after = JSON.parse(beforeJSON)

    if (before && !after) {
      change.remove.push(before.id)
    } else {
      change.replace.push(after)
    }
  })

  return change
}

export default {
  namespaced: true,
  state: {
    data: exporter.importData(emptyData),
    past: [],
    future: []
  },
  getters: {
    data (state) {
      return state.data
    },
    canUndo (state) {
      return state.past.length
    },
    canRedo (state) {
      return state.future.length
    }
  },
  mutations: {
    importData ({ data: sd, past, future }, importData) {
      past.splice(0)
      future.splice(0)

      // Clean old data
      Object.keys(sd).forEach(key => {
        Vue.delete(sd, key)
      })

      // Load new data
      const data = exporter.importData(importData)
      Object.keys(data).forEach(key =>
        Vue.set(sd, key, data[key])
      )
    },
    setValues ({ data: sd }, data) {
      Object.keys(data).forEach(key => {
        const value = data[key]
        if (value != null && value !== '') {
          Vue.set(sd, key, value)
        } else {
          Vue.delete(sd, key)
        }
      })
    },
    applyChange ({ data: sd }, { remove, update, replace }) {
      remove && remove.forEach(id => {
        Vue.delete(sd.items, id)
      })

      update && update.forEach(item => {
        const saved = sd.items[item.id]
        Object.keys(item).forEach(key => {
          Vue.set(saved, key, item[key])
        })
      })

      replace && replace.forEach(item => {
        if (item.id == null) {
          throw new Error('Items have to have ids.')
        }
        Vue.set(sd.items, item.id, item)
      })
    },
    pushChange ({ past, future }, unit) {
      future.splice(0)
      past.push(unit)
    },
    undoShift ({ past, future }) {
      future.push(past.pop())
    },
    redoShift ({ past, future }) {
      past.push(future.pop())
    }
  },
  actions: {
    removeItems ({ commit, state }, ids) {
      commit('pushChange', ids.map(id => ({
        before: JSON.stringify(state.data.items[id] || null),
        after: JSON.stringify(null)
      })))

      commit('applyChange', {
        remove: ids
      })
    },
    updateItems ({ commit, state }, items) {
      commit('pushChange', items.map(item => {
        const before = state.data.items[item.id]
        return {
          before: JSON.stringify(before || null),
          after: JSON.stringify({ ...before, ...item })
        }
      }))

      commit('applyChange', {
        update: items
      })
    },
    replaceItems ({ commit, state }, items) {
      commit('pushChange', items.map(item => ({
        before: JSON.stringify(state.data.items[item.id] || null),
        after: JSON.stringify(item)
      })))

      commit('applyChange', {
        replace: items
      })
    },
    undo ({ commit, state }) {
      const unit = state.past[state.past.length - 1]
      if (unit) {
        commit('undoShift')
        commit('applyChange', prepareUndoRedoChange(unit))
      } else {
        throw new Error('Nothing to undo.')
      }
    },
    redo ({ commit, state }) {
      const unit = state.future[state.future.length - 1]
      if (unit) {
        commit('redoShift')
        commit('applyChange', prepareUndoRedoChange(
          unit.map(({ after, before }) => ({ after: before, before: after }))
        ))
      } else {
        throw new Error('Nothing to redo.')
      }
    }
  }
}
