module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  devServer: {
      hot: false
  },
  pluginOptions: {
    webpackBundleAnalyzer: {
        analyzerMode: "static",
        openAnalyzer: false
    }
  }
}