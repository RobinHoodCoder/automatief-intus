const path = require("path");


module.exports = {
  mode: "development",
  output: {
    filename: "scripts.min.js"
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        // type: 'javascript/auto',
        // test: /\.json$/, // Maybe better to use a different extname (e.g /\.config\.json$/)
        exclude: /node_modules/,
        include: [path.resolve(__dirname, "./src/assets/js")],
        loader: ["babel-loader"]
      }
    ]
  },
};