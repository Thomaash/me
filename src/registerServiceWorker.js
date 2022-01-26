import { register } from "register-service-worker";
import { store } from "./store";

if (process.env.NODE_ENV === "production") {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {},
    registered() {},
    cached() {},
    updatefound() {},
    updated() {
      store.commit("setUpdateAvailable");
    },
    offline() {},
    error(error) {
      console.error("Error during service worker registration:", error);
    },
  });
}
