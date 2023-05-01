const path = require("path")
// eslint-disable-next-line
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "bundle.js",
    clean: true
  },
  resolve: {
    extensions: [".js", ".ts"],
    modules: [path.resolve("./src"), path.resolve("./node_modules")],
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      // LOAD SHADERS
      {
        test: /\.(glsl|vs|fs|vert|frag)$/i, 
        exclude: /node_modules/, 
        use: ['raw-loader', 'glslify-loader'],
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      inject: "body",
      publicPath: "./"
    }),
    new ESLintPlugin()
  ]
}