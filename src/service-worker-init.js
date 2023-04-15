import { store } from "./store";

export function initServiceWorker() {
  if (!("Cypress" in globalThis) && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").then((reg) => {
      reg?.addEventListener("updatefound", function () {
        store.commit("setUpdateAvailable");
      });
    });
  }
}
