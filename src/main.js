import './main.styl'
import '@mdi/font/css/materialdesignicons.css'
import App from './App'
import Vue from 'vue'
import Vuelidate from 'vuelidate'
import Vuetify from 'vuetify'
import VuetifyConfirm from 'vuetify-confirm'
import router from './router'
import store from './store'
import { vuetify as theme } from './theme'

Vue.use(Vuetify, {
  theme,
  iconfont: 'mdi',
  icons: {
    'success': 'mdi-check-circle',
    'info': 'mdi-information',
    'warning': 'mdi-alert',
    'error': 'mdi-alert-octagon',

    'checkboxFalse': 'mdi-close-box',
    'checkboxTrue': 'mdi-checkbox-marked',
    'checkboxUndefined': 'mdi-checkbox-blank-outline',

    'net-controller': 'mdi-developer-board',
    'net-dummy': 'mdi-label',
    'net-edge': 'mdi-ethernet-cable',
    'net-host': 'mdi-laptop',
    'net-label': 'mdi-label',
    'net-port': 'mdi-ethernet',
    'net-switch': 'mdi-switch'
  }
})
Vue.use(Vuelidate)
Vue.use(VuetifyConfirm)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
