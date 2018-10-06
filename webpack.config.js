var path = require("path");

module.exports = {

    entry:  {
        app :   __dirname + "/webapp/app/index.js",
        admin : __dirname + "/webapp/admin/index.js"
    },
    
    output: {
        path: path.join(__dirname, "dist"),
        publicPath: "dist/",
        filename: "[name].js"
    },

    module: {
        rules: [
          { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
          { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
          { test: /\.css$/, loaders: ["style-loader","css-loader"] },
          {
            test: /\.scss$/,
            use: [{
                loader: "style-loader" // creates style nodes from JS strings
            }, {
                loader: "css-loader" // translates CSS into CommonJS
            }, {
                loader: "sass-loader" // compiles Sass to CSS
            }]
          },
          {
            test: /\.(png|woff|woff2|eot|ttf|svg)$/,
            use: {
                loader: 'url-loader',
                options: {
                  limit: 100000,
                },
              }
          }
        ]
    },

    devServer: {
        contentBase: path.join(__dirname, "public"),
        publicPath: path.join(__dirname, "public"),
        watchContentBase: true,
        compress: false,
        port: 8080,
        hot: true
    }

}