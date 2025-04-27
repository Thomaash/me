import "source-sans-pro/source-sans-pro.css";
import "source-code-pro/source-code-pro.css";
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles/main.css";

import { createApp } from "vue";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";

import App from "./App.vue";
import router from "./router";
import store from "./store";
import { dark, vuetifyDark, vuetifyLight } from "./theme";

import { initServiceWorker } from "./service-worker-init";

const vuetify = createVuetify({
  theme: {
    defaultTheme: dark ? "dark" : "light",
    themes: {
      light: vuetifyLight,
      dark: vuetifyDark,
    },
  },
  icons: {
    defaultSet: "mdi",
    aliases: {
      ...aliases,

      success: "mdi-check-circle",
      info: "mdi-information",
      warning: "mdi-alert",
      error: "mdi-alert-octagon",

      checkboxFalse: "mdi-close-box",
      checkboxTrue: "mdi-checkbox-marked",
      checkboxUndefined: "mdi-checkbox-blank-outline",

      "net-controller": "mdi-developer-board",
      "net-dummy": "mdi-label",
      "net-edge": "mdi-ethernet-cable",
      "net-host": "mdi-laptop",
      "net-label": "mdi-label",
      "net-port": "mdi-ethernet",
      "net-switch": "mdi-switch",
    },
    sets: {
      mdi,
    },
  },
});

const app = createApp(App);
app.use(vuetify);
app.use(store);
app.use(router);
app.mount("#app");

initServiceWorker();
