module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  devServer: {
      hot: false
  },
  publicPath: "./",
  pluginOptions: {
    webpackBundleAnalyzer: {
        analyzerMode: "static",
        openAnalyzer: false
    }
  }
}