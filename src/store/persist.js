import {
  LTM,
  executeWithDelay,
  localForage,
  mutationFilter,
  pickModules,
  shallowMerge,
} from "vuex-ltm";

export const ltm = new LTM({
  execute: executeWithDelay(2000),
  filter: mutationFilter([/^topology\//]),
  merge: shallowMerge,
  reduce: pickModules(["topology"]),
  storage: localForage("vuex-me", {
    name: "Vuex",
    version: 1.0,
    storeName: "vuex-me",
  }),
});
