import Vue from 'vue'
import exporter from '@/exporter'

import emptyData from '@/examples/empty'

const MAX_UNDO_LENGTH = 200
export { MAX_UNDO_LENGTH }

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
    },
    boundingBox (state) {
      // Find the highest and lowest x and y item center coordinates
      const rawBB = (() => {
        const items = Object.values(state.data.items)

        if (!items.length) {
          return { sX: 0, eX: 0, sY: 0, eY: 0, empty: true }
        }

        // Edges don't have x and y coordinates
        // There can't be an edge without a node
        const first = items.find(({ x, y }) => x != null && y != null)
        return items.reduce((acc, { x, y }) => {
          if (x < acc.sX) {
            acc.sX = x
          } else if (x > acc.eX) {
            acc.eX = x
          }
          if (y < acc.sY) {
            acc.sY = y
          } else if (y > acc.eY) {
            acc.eY = y
          }

          return acc
        }, {
          // Some item's position has to be used
          // If some other values were used they would be included as an imaginary item
          sX: first.x,
          eX: first.x,
          sY: first.y,
          eY: first.y,
          empty: false
        })
      })()

      return ({ margin = 100, scale = 1 } = {}) => {
        const bb = { ...rawBB, width: 0, height: 0 }

        // Empty project
        if (bb.empty) {
          return bb
        }

        // Add margin
        bb.sX -= margin
        bb.sY -= margin
        bb.eX += margin
        bb.eY += margin

        // Apply scale
        bb.sX *= scale
        bb.sY *= scale
        bb.eX *= scale
        bb.eY *= scale

        // Round to integers
        bb.sX = Math.ceil(Math.abs(bb.sX)) * Math.sign(bb.sX)
        bb.sY = Math.ceil(Math.abs(bb.sY)) * Math.sign(bb.sY)
        bb.eX = Math.ceil(Math.abs(bb.eX)) * Math.sign(bb.eX)
        bb.eY = Math.ceil(Math.abs(bb.eY)) * Math.sign(bb.eY)

        // Compute size
        bb.width = bb.eX - bb.sX
        bb.height = bb.eY - bb.sY

        return bb
      }
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
        if (item.id == null) {
          throw new Error('Items have to have ids.')
        }
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
      if (past.length >= MAX_UNDO_LENGTH) {
        past.splice(0, past.length + 1 - MAX_UNDO_LENGTH)
      }
      past.push(unit)
    },
    undoShift ({ past, future }) {
      if (past.length) {
        if (future.length >= MAX_UNDO_LENGTH) {
          future.shift()
        }
        future.push(past.pop())
      }
    },
    redoShift ({ past, future }) {
      if (future.length) {
        if (past.length >= MAX_UNDO_LENGTH) {
          past.shift()
        }
        past.push(future.pop())
      }
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
