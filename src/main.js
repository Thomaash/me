import 'vuetify/dist/vuetify.min.css'
import App from './App'
import Vue from 'vue'
import Vuetify from 'vuetify'
import router from './router'
import store from './store'

Vue.use(Vuetify, { theme: {
  primary: '#009688',
  secondary: '#009688',
  accent: '#009688',
  error: '#f44336',
  warning: '#ffeb3b',
  info: '#2196f3',
  success: '#4caf50'
}})

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
