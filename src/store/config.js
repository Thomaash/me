import { ltm } from "./persist";
import { syncPlugin } from "./sync";
import { topology } from "./topology";

export const ready = ltm.ready;
export const config = {
  strict: process.env.NODE_ENV === "development",
  state: {
    loading: true,
    working: false,
    isUpdateAvailable: false,
    alert: { show: false },
  },
  mutations: {
    loaded(state) {
      state.loading = false;
    },
    setWorking(state, { working, curr, max }) {
      if (!isNaN(curr) && !isNaN(max)) {
        state.working = { curr, max };
      } else {
        state.working = !!working;
      }
    },
    setAlert(state, { type, text }) {
      state.alert = { show: true, type, text };
    },
    clearAlert(state) {
      state.alert.show = false;
    },
    setUpdateAvailable(state) {
      state.isUpdateAvailable = true;
    },
  },
  actions: {},
  modules: {
    topology,
  },
  plugins: [ltm.plugin, syncPlugin],
};
