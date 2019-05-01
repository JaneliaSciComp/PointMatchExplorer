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
    ],
  },
};
