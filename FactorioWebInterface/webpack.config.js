const path = require("path");
const TerserJSPlugin = require('terser-webpack-plugin');
//const HtmlWebpackPlugin = require("html-webpack-plugin");
//const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const glob = require('glob');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
    entry: {
        tests: glob.sync("./src/**/*.spec.ts"),
        serversOld: "./src/ts/servers.ts",
        bansOld: "./src/ts/bans.ts",
        adminsOld: "./src/ts/admins.ts",
        saves: "./src/ts/saves.ts",
        scenarioDataOld: "./src/ts/scenarioData.ts",
        plaguesplayground: "./src/ts/plaguesPlayground.ts",
        mods: "./src/ts/mods.ts",
        //test: "./src/ts/test.ts",
        //testOld: "./src/ts/testOld.ts"
        servers: "./src/pages/servers/serversPage.ts",
        admins: "./src/pages/admins/adminsPage.ts",
        bans: "./src/pages/bans/bansPage.ts",
        scenarioData: "./src/pages/scenarioData/scenarioDataPage.ts"
    },
    output: {
        path: path.resolve(__dirname, "wwwroot"),
        filename: "js/[name].js",
        devtoolModuleFilenameTemplate: '[resource-path]',
        publicPath: "/"
    },
    resolve: {
        extensions: [".ts", ".js", ".css"]
    },
    externals: {
        jquery: 'jQuery'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.(css|less)$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: '/',
                            hmr: isDev,
                            reloadAll: true
                        }
                    },
                    "css-loader",
                    "less-loader"
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].css'
        }),
        //new RemovePlugin({            
        //    before: {
        //        include: [path.resolve(__dirname, 'wwwroot/css/test.css')]
        //    },
        //    watch: {
        //        include: [path.resolve(__dirname, 'wwwroot/css/test.css')]
        //    }
        //})
    ],
    optimization: {
        minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
    },
    stats: 'errors-only',
    devtool: "source-map"
};