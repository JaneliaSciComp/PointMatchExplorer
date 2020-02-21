const path = require('path');

process.traceDeprecation = true;

const defaultPort = 3000;
module.exports = {
  mode: "production", // "production" | "development" | "none"
  entry: {
    pme: './src/root.js'
  },
  output: { 
    path: __dirname, 
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: path.resolve(__dirname),
    port: defaultPort,
  },
  devtool: "source-map",
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
      // from https://getbootstrap.com/docs/4.0/getting-started/webpack/#importing-compiled-css
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      // from https://www.chriscourses.com/blog/loading-fonts-webpack
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      }
    ],
  },
};
