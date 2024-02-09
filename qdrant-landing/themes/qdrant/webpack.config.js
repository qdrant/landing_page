// for now it only bundle js files required in ./themes/qdrant/vendor/js/vendor.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (env, argv) {

  const isEnvDevelopment = argv.mode === 'development';
  const isEnvProduction = argv.mode === 'production';

  return {
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    context: __dirname,
    entry: {
      vendor: './vendor/js/vendor.js',
    },
    output: {
      path: path.resolve(__dirname, './static/js'),
      filename: '[name].min.js'
    },
    externals: {
      jquery: 'jQuery',
    },
    optimization: {
      concatenateModules: false,
      minimizer: [
        new TerserPlugin({
          test: /\.js(\?.*)?$/i,
          terserOptions: {
            compress: false,
            keep_classnames: true,
            keep_fnames: true,
          },
        }),
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'node_modules/qdrant-page-search/dist/js/search.min.js'),
            to: 'qdr-search.min.js'
          },
          {
            from: path.resolve(__dirname, 'node_modules/qdrant-page-search/dist/js/scroll.min.js'),
            to: 'qdr-scroll.min.js'
          },
          {
            from: path.resolve(__dirname, 'node_modules/qdrant-page-search/dist/css/styles.min.css'),
            to: '../css/qdr-search.min.css'
          }
        ]
      }),
    ]
  };
}