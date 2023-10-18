const webpack = require("webpack");
const { execSync } = require("child_process");

process.env.VUE_APP_BUILD_DATE = new Date().toISOString();
process.env.VUE_APP_BUILD_COMMIT_HASH = execSync("git log -1 --format=%H", {
  encoding: "ascii",
}).trim();
process.env.VUE_APP_BUILD_COMMIT_DATE = new Date(
  execSync("git log -1 --format=%ct", {
    encoding: "ascii",
  }).trim() * 1000,
).toISOString();

module.exports = {
  publicPath: "./",

  // Do not fail the build with linting errors. It sometimes reports errors
  // that are simply not there.
  lintOnSave: "warning",

  // There are issues with parallelism in CircleCI.
  parallel: !process.env.CIRCLECI,

  transpileDependencies: ["vuetify", "vuex-ltm"],

  chainWebpack: (config) => {
    config.module
      .rule("txt")
      .test(/(\.(txt|py)$|^[^.]+$)/)
      .use("raw")
      .loader("raw-loader")
      .end();

    config.resolve.set("fallback", {
      assert: false,
      fs: false,
      http: false,
      https: false,
      path: false,
      stream: false,
      util: false,
      zlib: false,
    });

    config.plugin("clean").use(webpack.DefinePlugin, [
      {
        "process.browser": JSON.stringify(true),
      },
    ]);
  },

  pwa: {
    msTileColor: "#009688",
    name: "Mininet Editor",
    themeColor: "#009688",
    workboxPluginMode: "GenerateSW",
  },
};
