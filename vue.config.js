module.exports = {
  baseUrl: './',
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
