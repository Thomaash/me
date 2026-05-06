import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStore = defineStore("app", () => {
  const loading = ref(true);
  const working = ref(false);
  const isUpdateAvailable = ref(false);
  const alert = ref({ show: false });
  const saveState = ref("idle"); // "idle" | "pending" | "saving" | "error"

  function loaded() {
    loading.value = false;
  }

  function setWorking({ working: w, curr, max }) {
    if (!isNaN(curr) && !isNaN(max)) {
      working.value = { curr, max };
    } else {
      working.value = !!w;
    }
  }

  function setAlert({ type, text }) {
    alert.value = { show: true, type, text };
  }

  function clearAlert() {
    alert.value.show = false;
  }

  function setUpdateAvailable() {
    isUpdateAvailable.value = true;
  }

  function markPending() {
    saveState.value = "pending";
  }

  function markSaving() {
    saveState.value = "saving";
  }

  function markSaved() {
    saveState.value = "idle";
  }

  function markSaveError(_err) {
    saveState.value = "error";
  }

  return {
    loading,
    working,
    isUpdateAvailable,
    alert,
    saveState,
    loaded,
    setWorking,
    setAlert,
    clearAlert,
    setUpdateAvailable,
    markPending,
    markSaving,
    markSaved,
    markSaveError,
  };
});
