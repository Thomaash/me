import { store } from "./store";

export function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((reg) => {
        return reg?.addEventListener("updatefound", function () {
          store.commit("setUpdateAvailable");
        });
      })
      .catch((error) => {
        console.error(error, "Failed to register service worker");
      });
  }
}
