var path = require("path");
module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "index.js",
    libraryTarget: "commonjs2"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, "src"),
        exclude: /(build)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["es2015", "stage-2", "react"]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: require.resolve("style-loader")
          },
          {
            loader: require.resolve("css-loader")
          }
        ]
      },
      {
        test: /\.svg$/,
        loader: require.resolve("url-loader"),
        options: {
          name: "static/media/[name].[hash:8].[ext]"
        }
      }
    ]
  }
};
