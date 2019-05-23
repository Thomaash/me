import {
  LTM,
  executeWithDelay,
  localForage,
  mutationFilter,
  pickModules,
  replace
} from 'vuex-ltm'

export const ltm = new LTM({
  execute: executeWithDelay(2000),
  filter: mutationFilter([/^topology\//]),
  merge: replace,
  reduce: pickModules(['topology']),
  storage: localForage({
    name: 'Vuex',
    version: 1.0,
    storeName: 'vuex-me'
  })
})
