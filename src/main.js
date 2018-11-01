import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/dist/vuetify.min.css'
import App from './App'
import Vue from 'vue'
import Vuelidate from 'vuelidate'
import Vuetify from 'vuetify'
import router from './router'
import store from './store'

Vue.use(Vuelidate)
Vue.use(Vuetify, {
  theme: {
    primary: '#009688',
    secondary: '#26A69A',
    accent: '#009688',
    error: '#f44336',
    warning: '#ffeb3b',
    info: '#2196f3',
    success: '#4caf50'
  },
  iconfont: 'mdi',
  icons: {
    'net-controller': 'mdi-developer-board',
    'net-dummy': 'mdi-label',
    'net-edge': 'mdi-ethernet-cable',
    'net-host': 'mdi-laptop',
    'net-label': 'mdi-label',
    'net-port': 'mdi-ethernet',
    'net-switch': 'mdi-switch'
  }
})

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
