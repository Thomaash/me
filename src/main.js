import "source-sans-pro/source-sans-pro.css";
import "source-code-pro/source-code-pro.css";
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/dist/vuetify.min.css";

import App from "./App.vue";
import Vue from "vue";
import Vuetify from "vuetify";
import VuetifyConfirm from "vuetify-confirm";
import router from "./router";
import store from "./store";
import { dark, vuetifyDark, vuetifyLight } from "./theme";

import { initServiceWorker } from "./service-worker-init";

Vue.use(Vuetify);
const vuetify = new Vuetify({
  theme: {
    themes: {
      light: vuetifyLight,
      dark: vuetifyDark,
    },
    dark,
  },
  icons: {
    iconfont: "mdi",
    values: {
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
  },
});

Vue.use(VuetifyConfirm, { vuetify });

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: "#app",

  router,
  store,
  vuetify,

  render: (h) => h(App),
});

initServiceWorker();
