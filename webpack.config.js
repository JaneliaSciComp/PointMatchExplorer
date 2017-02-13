var path = require('path');
var webpack = require('webpack');

var defaultPort = 3000;
module.exports = {
  entry: './src/root.js',
  output: { 
    path: __dirname, 
    filename: 'bundle.js' 
  },
  devServer: {
    contentBase: path.resolve(__dirname),
    port: defaultPort,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            query: {
              presets: ['es2015', 'react']
            }
          },
          {
            loader: 'eslint-loader',
            options: {rules: {semi: 0}}
          }
        ],
      },
    ],
  },
  plugins: [
          function() {
              //show timestamp before compiling
              this.plugin('watch-run', function(watching, callback) {
                  console.log('Begin compile at ' + new Date());
                  callback();
              })
          }
  ],
};
/*
    loaders: [
      {
        test: /.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
*/