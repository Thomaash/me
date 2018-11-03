import Router from 'vue-router'
import Vue from 'vue'

import Canvas from '@/components/Canvas'
import Export from '@/components/Export'
import Home from '@/components/Home'

Vue.use(Router)

export default new Router({
  routes: [ {
    path: '/',
    name: 'Home',
    component: Home
  }, {
    path: '/canvas/:id?',
    name: 'Canvas',
    component: Canvas
  }, {
    path: '/export',
    name: 'Export',
    component: Export
  } ]
})
