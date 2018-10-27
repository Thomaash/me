import Router from 'vue-router'
import Vue from 'vue'

import Canvas from '@/components/Canvas'
import Export from '@/components/Export'
import HelloWorld from '@/components/HelloWorld'

Vue.use(Router)

export default new Router({
  routes: [ {
    path: '/',
    name: 'HelloWorld',
    component: HelloWorld
  }, {
    path: '/canvas',
    name: 'Canvas',
    component: Canvas
  }, {
    path: '/export',
    name: 'Export',
    component: Export
  } ]
})
