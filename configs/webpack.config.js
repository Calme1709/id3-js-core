const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const webpackDts = require("@ahrakio/witty-webpack-declaration-files");

module.exports = {
    entry: "./src/index.ts",
    devtool: 'inline-source-map',
    target: "node",
    mode: "production",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: "/\.json$/",
                use: 'json-loader'
            }
        ]
    },
    resolve: {
        extensions: [ '.ts', ".json" ],
        plugins: [new TsconfigPathsPlugin({ configFile: path.resolve(__dirname + "/../tsconfig.json" )})]
    },
    plugins: [
        new webpackDts({
            merge: true
        })
    ],
    externals: {
        buffer: {
            commonjs: "buffer"
        }
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname + "/../dist"),
        libraryTarget: "commonjs"
    }
}