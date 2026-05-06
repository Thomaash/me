import localforage from "localforage";
import { useAppStore } from "@/store/appStore";

const storage = localforage.createInstance({
  name: "Vuex",
  version: 1.0,
  storeName: "vuex-me",
});
const STORAGE_KEY = "vuex-me";
const DEBOUNCE_MS = 2000;

let resolveReady;
let rejectReady;
export const ready = new Promise((resolve, reject) => {
  resolveReady = resolve;
  rejectReady = reject;
});

export function persistPlugin({ store, options }) {
  if (!options.persist) {
    return;
  }

  const appStore = useAppStore();
  let restoring = false;

  storage
    .getItem(STORAGE_KEY)
    .then((saved) => {
      if (saved && saved.topology) {
        restoring = true;
        store.$patch((state) => {
          Object.assign(state, saved.topology);
        });
        restoring = false;
      }
      return resolveReady();
    })
    .catch((err) => {
      rejectReady(err);
    });

  let timeout = null;
  store.$subscribe(() => {
    if (restoring) {
      return;
    }
    appStore.markPending();
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      appStore.markSaving();
      try {
        await storage.setItem(STORAGE_KEY, {
          topology: JSON.parse(JSON.stringify(store.$state)),
        });
        appStore.markSaved();
      } catch (err) {
        appStore.markSaveError(err);
      } finally {
        timeout = null;
      }
    }, DEBOUNCE_MS);
  });
}
