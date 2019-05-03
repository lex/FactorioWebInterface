const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: {
        servers: "./src/ts/servers.ts",
        bans: "./src/ts/bans.ts",
        admins: "./src/ts/admins.ts",
        saves: "./src/ts/saves.ts",
        scenarioData: "./src/ts/scenarioData.ts",
        plaguesplayground: "./src/ts/plaguesPlayground.ts",
        mods: "./src/ts/mods.ts"
    },
    output: {
        path: path.resolve(__dirname, "wwwroot"),
        filename: "js/[name].js",
        publicPath: "/"
    },
    resolve: {
        extensions: [".js", ".ts"]
    },
    externals: {
        jquery: 'jQuery'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader"
            },
            //{
            //    test: /\.css$/,
            //    use: [MiniCssExtractPlugin.loader, "css-loader"]
            //}
        ]
    },
    plugins: [
        //new CleanWebpackPlugin(["wwwroot/*"]),
        //new HtmlWebpackPlugin({
        //    template: "./src/index.html"
        //}),
        //new MiniCssExtractPlugin({
        //    filename: "css/[name].css"
        //})
    ],
    devtool: "source-map"
};