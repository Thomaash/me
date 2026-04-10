import { pinia } from "./store/pinia";
import { useAppStore } from "./store/appStore";

export function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((reg) => {
        return reg?.addEventListener("updatefound", function () {
          const appStore = useAppStore(pinia);
          appStore.setUpdateAvailable();
        });
      })
      .catch((error) => {
        console.error(error, "Failed to register service worker");
      });
  }
}
