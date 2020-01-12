const WorkerPlugin = require('worker-plugin')

module.exports = {
  publicPath: './',

  // Do not fail the build with linting errors. It sometimes reports errors
  // that are simply not there.
  lintOnSave: 'warning',

  // There are issues with parallelism in CircleCI.
  parallel: !process.env.CIRCLECI,

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
