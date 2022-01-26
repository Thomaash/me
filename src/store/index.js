import Vue from "vue";
import Vuex from "vuex";

import { config, ready } from "./config";

Vue.use(Vuex);

export const store = new Vuex.Store(config);
export default store;

ready.then(() => {
  store.commit("loaded");
});
