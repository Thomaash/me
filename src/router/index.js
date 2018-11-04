import Router from 'vue-router'
import Vue from 'vue'

import Canvas from '@/components/Canvas'
import Export from '@/components/Export'
import Home from '@/components/Home'
import Script from '@/components/Script'

Vue.use(Router)

export default new Router({
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
  } ]
})
