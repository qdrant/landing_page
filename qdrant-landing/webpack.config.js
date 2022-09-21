// for now it only bundle js files required in ./themes/qdrant/vendor/js/vendor.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = function (env, argv) {

  const isEnvDevelopment = argv.mode === 'development';
  const isEnvProduction = argv.mode === 'production';

  return {
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    context: __dirname,
    entry: {
      vendor: './themes/qdrant/vendor/js/vendor.js',
    },
    output: {
      path: path.resolve(__dirname, './themes/qdrant/static/js'),
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
        //   {
        //   from: path.resolve(__dirname, 'node_modules/@splidejs/splide/dist/js/splide.min.js'),
        //   to: 'themes/qdrant/vendor/js/splide.min.js'
        // },
       // {
       //    from: path.resolve(__dirname, 'node_modules/@splidejs/splide/dist/css/splide-core.min.css'),
       //    to: 'themes/qdrant/static/css/splide-core.min.css'
       //  }
        ]
      }),
    ]
  };
}