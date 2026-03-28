import { createStore } from "vuex";

import { config, ready } from "./config";

export const store = createStore(config);

ready
  .then(() => {
    store.commit("loaded");
  })
  .catch((error) => {
    console.error(error, "Failed to load store from local storage");
  });
