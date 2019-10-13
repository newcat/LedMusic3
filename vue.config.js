const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
    configureWebpack: {
        plugins: [
            new WasmPackPlugin({
                crateDirectory: __dirname
            })
        ]
    }
}