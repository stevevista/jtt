'use strict'
process.env.BABEL_ENV = 'web'
const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const MinifyPlugin = require("babel-minify-webpack-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CompressionPlugin = require("compression-webpack-plugin")

const rendererConfig = {
  devtool: '#cheap-module-eval-source-map',
  entry: {},
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/public'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(yml|yaml)$/,
        loader: 'yml-loader'
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'less-loader', // compiles Less to CSS
            options: {
              javascriptEnabled: true,
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
      {
        test: /\.(js|vue)$/,
        enforce: 'pre',
        exclude: /(node_modules|fonts)/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter')
          }
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/react', '@babel/env'],
              plugins: ['@babel/plugin-proposal-class-properties', ["import", { "libraryName": "antd", "libraryDirectory": "es", "style": true }]]
            }
          }
        ],
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name]--[folder].[ext]'
          }
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name]--[folder].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name]--[folder].[ext]'
          }
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['dist/public']),
    new MiniCssExtractPlugin({
      filename: "[name].css"
    }),
    new webpack.DefinePlugin({
      'process.env.IS_WEB': true
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  optimization: {
    minimizer: [],
    splitChunks: {
      chunks: "async",
      minSize: 30000,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src/web')
    },
    extensions: ['.js', '.json', '.css', '.node', '.vue']
  },
  mode: process.env.NODE_ENV,
  target: 'web'
}

function getEntries () {
  const entries = []
  const base = path.resolve(__dirname, 'src/web')
  for (const name of fs.readdirSync(base)) {
    const entryPath = path.join(base, name, 'index.js')
    if (fs.existsSync(entryPath)) {
      entries.push({name, entryPath})
    }
  }
  return entries
}

getEntries().forEach(entry => {
  rendererConfig.entry[entry.name] = entry.entryPath

  rendererConfig.plugins.push(new HtmlWebpackPlugin({
    filename: entry.name + '.html',
    chunks: [entry.name],
    template: path.resolve(__dirname, 'src/web/index.ejs'),
    minify: {
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true
    }
  }))
})

if (process.env.NODE_ENV === 'production') {
  rendererConfig.devtool = false

  rendererConfig.plugins.push(
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src/web/static'),
        to: path.join(__dirname, 'dist/public'),
        ignore: ['.*']
      }
    ]),
    new CompressionPlugin()
  )

  rendererConfig.plugins.push(new MinifyPlugin())
  rendererConfig.optimization.minimizer.push(new OptimizeCSSAssetsPlugin({}))
}

module.exports = rendererConfig
