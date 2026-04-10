import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    loading: true,
    working: false,
    isUpdateAvailable: false,
    alert: { show: false },
    saveState: "idle", // "idle" | "pending" | "saving" | "error"
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
    markPending() {
      this.saveState = "pending";
    },
    markSaving() {
      this.saveState = "saving";
    },
    markSaved() {
      this.saveState = "idle";
    },
    markSaveError(_err) {
      this.saveState = "error";
    },
  },
});
