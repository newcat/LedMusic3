/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
    transpileDependencies: ["vuetify"],

    devServer: {
        hot: false,
    },

    publicPath: "./",

    pluginOptions: {
        webpackBundleAnalyzer: {
            analyzerMode: "static",
            openAnalyzer: false,
        },
    },

    configureWebpack: {
        target: "electron-renderer",
        plugins: [
            new WasmPackPlugin({
                crateDirectory: path.resolve(__dirname, "src", "rust"),
            }),
        ],
    },

    lintOnSave: false,
};
