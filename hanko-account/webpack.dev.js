const path = require('path')
const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const Dotenv = require('dotenv-webpack')

module.exports = merge(common, {
  mode: 'production',
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    historyApiFallback: true
  },
  devtool: 'inline-source-map',
  mode: 'development',
  plugins: [new Dotenv({ path: path.join(__dirname, '.env.local') })]
})