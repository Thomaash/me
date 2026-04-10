import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    loading: true,
    working: false,
    isUpdateAvailable: false,
    alert: { show: false },
  }),
  actions: {
    loaded() {
      this.loading = false;
    },
    setWorking({ working, curr, max }) {
      if (!isNaN(curr) && !isNaN(max)) {
        this.working = { curr, max };
      } else {
        this.working = !!working;
      }
    },
    setAlert({ type, text }) {
      this.alert = { show: true, type, text };
    },
    clearAlert() {
      this.alert.show = false;
    },
    setUpdateAvailable() {
      this.isUpdateAvailable = true;
    },
  },
});
