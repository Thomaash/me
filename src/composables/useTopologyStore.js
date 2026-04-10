import { computed } from "vue";
import { useTopologyStore as useRawTopologyStore } from "@/store/topologyStore";
import { useAppStore } from "@/store/appStore";

export function useTopologyStore() {
  const topologyStore = useRawTopologyStore();
  const appStore = useAppStore();

  return {
    // Topology state and getters (as computed refs)
    data: computed(() => topologyStore.data),
    past: computed(() => topologyStore.past),
    future: computed(() => topologyStore.future),
    canUndo: computed(() => topologyStore.canUndo),
    canRedo: computed(() => topologyStore.canRedo),
    boundingBox: computed(() => topologyStore.boundingBox),

    // App state (as computed refs)
    loading: computed(() => appStore.loading),
    working: computed(() => appStore.working),
    alert: computed(() => appStore.alert),
    isUpdateAvailable: computed(() => appStore.isUpdateAvailable),

    // App actions (delegating through store so spies work)
    setWorking: (...args) => appStore.setWorking(...args),
    setAlert: (...args) => appStore.setAlert(...args),
    clearAlert: (...args) => appStore.clearAlert(...args),
    loaded: (...args) => appStore.loaded(...args),
    setUpdateAvailable: (...args) => appStore.setUpdateAvailable(...args),

    // Topology actions (delegating through store so spies work)
    importData: (...args) => topologyStore.importData(...args),
    setValues: (...args) => topologyStore.setValues(...args),
    applyChange: (...args) => topologyStore.applyChange(...args),
    removeItems: (...args) => topologyStore.removeItems(...args),
    updateItems: (...args) => topologyStore.updateItems(...args),
    replaceItems: (...args) => topologyStore.replaceItems(...args),
    undo: (...args) => topologyStore.undo(...args),
    redo: (...args) => topologyStore.redo(...args),
  };
}
