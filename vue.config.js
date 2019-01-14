module.exports = {
  publicPath: './',

  transpileDependencies: ['vuex-persist'],

  chainWebpack: config => {
    config
      .module
      .rule('txt')
      .test(/(\.(txt|py)$|^[^.]+$)/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
  }
}
