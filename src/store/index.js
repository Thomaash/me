import { createStore } from "vuex";

import { config, ready } from "./config";

export const store = new createStore(config);
export { ready };

ready
  .then(() => {
    store.commit("loaded");
  })
  .catch((error) => {
    console.error(error, "Failed to load store from local storage");
  });
