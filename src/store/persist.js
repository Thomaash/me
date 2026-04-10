import { toRaw } from "vue";
import localforage from "localforage";

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

  storage
    .getItem(STORAGE_KEY)
    .then((saved) => {
      if (saved && saved.topology) {
        store.$patch((state) => {
          Object.assign(state, saved.topology);
        });
      }
      return resolveReady();
    })
    .catch((err) => {
      rejectReady(err);
    });

  let timeout = null;
  store.$subscribe(() => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      storage.setItem(STORAGE_KEY, {
        topology: toRaw(store.$state),
      });
      timeout = null;
    }, DEBOUNCE_MS);
  });
}
