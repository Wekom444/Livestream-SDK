const path = require('path');

module.exports = {
  entry: './server.js', // Update if your main file is different
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  target: 'node', // Ensures Webpack compiles for Node.js
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'), // Ensure 'src' exists or remove this
    },
  },
};
