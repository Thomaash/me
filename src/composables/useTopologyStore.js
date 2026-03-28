import { computed } from "vue";
import { useStore } from "vuex";

export function useTopologyStore() {
  const store = useStore();
  return {
    // Topology getters
    data: computed(() => store.getters["topology/data"]),
    canUndo: computed(() => store.getters["topology/canUndo"]),
    canRedo: computed(() => store.getters["topology/canRedo"]),
    boundingBox: computed(() => store.getters["topology/boundingBox"]),

    // Root state
    loading: computed(() => store.state.loading),
    working: computed(() => store.state.working),
    alert: computed(() => store.state.alert),
    isUpdateAvailable: computed(() => store.state.isUpdateAvailable),

    // Root mutations (as functions)
    setWorking: (payload) => store.commit("setWorking", payload),
    setAlert: (payload) => store.commit("setAlert", payload),
    clearAlert: () => store.commit("clearAlert"),

    // Topology actions
    dispatch: (action, payload) =>
      store.dispatch(`topology/${action}`, payload),
    commitTopology: (mutation, payload) =>
      store.commit(`topology/${mutation}`, payload),
    importData: (data) => store.commit("topology/importData", data),

    // For components that still need store.subscribe (VisCanvas)
    subscribe: (fn) => store.subscribe(fn),
  };
}
