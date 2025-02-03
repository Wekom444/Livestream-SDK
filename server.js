const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        main: './src/index.js', // Ensure only one entry point
    },
    output: {
        filename: '[name].bundle.js', // Use [name] to avoid conflicts
        path: path.resolve(__dirname, 'dist'),
        clean: true, // Ensures the output directory is cleaned before build
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
        splitChunks: {
            chunks: 'all', // Split large files for better performance
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
        }),
    ],
};
