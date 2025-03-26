const path = require("path");

module.exports = {
  entry: "./server.js", // Entry point of your application
  target: "node", // Ensure Webpack compiles for Node.js
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist"), // Output folder for the compiled files
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".js", ".json"] // Allow these file types in imports
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Target JavaScript files
        exclude: /node_modules/,
        use: {
          loader: "babel-loader" // Transpile ES6+ code for better compatibility
        }
      }
    ]
  }
};
