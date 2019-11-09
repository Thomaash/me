const WorkerPlugin = require('worker-plugin')

module.exports = {
  publicPath: './',

  transpileDependencies: [
    'vuetify',
    'vuex-ltm'
  ],

  chainWebpack: config => {
    config
      .module
      .rule('txt')
      .test(/(\.(txt|py)$|^[^.]+$)/)
      .use('raw')
      .loader('raw-loader')
      .end()

    config
      .module
      .rule('styl')
      .test(/\.styl$/)
      .use('stylus')
      .loader('style-loader')
      .loader('css-loader')
      .loader('stylus-loader')
      .end()

    config
      .plugin('worker-plugin')
      .use(WorkerPlugin)
  },

  pwa: {
    msTileColor: '#009688',
    name: 'Mininet Editor',
    themeColor: '#009688',
    workboxPluginMode: 'GenerateSW'
  }
}
