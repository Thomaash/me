import { useAppStore } from "./appStore";
import { useTopologyStore } from "./topologyStore";
import { pinia } from "./pinia";
import { ready } from "./persist";

export { pinia };

// Must be called after app.use(pinia) so that Pinia plugins (persist, sync)
// are active when stores are first created.
export function initStores() {
  useTopologyStore(pinia);
  const appStore = useAppStore(pinia);

  ready
    .then(() => {
      return appStore.loaded();
    })
    .catch((error) => {
      console.error(error, "Failed to load store from local storage");
    });
}
