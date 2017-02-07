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
    loaders: [
      {
        test: /.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
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
