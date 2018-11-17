import Router from 'vue-router'
import Vue from 'vue'
import store from '@/store'

import About from '@/components/About'
import Canvas from '@/components/Canvas'
import Export from '@/components/Export'
import Home from '@/components/Home'
import Script from '@/components/Script'

Vue.use(Router)

const router = new Router({
  routes: [ {
    path: '/',
    name: 'Home',
    component: Home
  }, {
    path: '/canvas/:ids?',
    name: 'Canvas',
    component: Canvas
  }, {
    path: '/script',
    name: 'Script',
    component: Script
  }, {
    path: '/export',
    name: 'Export',
    component: Export
  }, {
    path: '/about',
    name: 'About',
    component: About
  } ]
})

router.beforeEach((to, from, next) => {
  store.commit('clearAlert')
  next()
})

export default router
