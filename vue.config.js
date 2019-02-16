const WorkerPlugin = require('worker-plugin')

module.exports = {
  publicPath: './',

  transpileDependencies: ['vuex-persist'],

  chainWebpack: config => {
    config
      .module
      .rule('txt')
      .test(/(\.(txt|py)$|^[^.]+$)/)
      .use('raw')
      .loader('raw-loader')
      .end()

    config
      .plugin('worker-plugin')
      .use(WorkerPlugin)
  }
}
