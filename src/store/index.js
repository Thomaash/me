import { createStore } from "vuex";

import { config, ready } from "./config";

export const store = new createStore(config);

ready.then(() => {
  store.commit("loaded");
});
