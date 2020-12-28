const path = require("path");
const webpack = require('webpack');
const TerserJSPlugin = require('terser-webpack-plugin');
//const HtmlWebpackPlugin = require("html-webpack-plugin");
//const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const glob = require('glob');

module.exports = (env, argv) => {
    const isDev = argv.mode === 'development';
    const isTest = env.test;

    let entry;
    if (isTest) {
        entry = { tests: glob.sync("./client/**/*.spec.ts") };
    } else {
        entry = {
            saves: "./client/ts/saves.ts",
            plaguesplayground: "./client/ts/plaguesPlayground.ts",
            servers: "./client/pages/servers/serversPage.ts",
            admins: "./client/pages/admins/adminsPage.ts",
            bans: "./client/pages/bans/bansPage.ts",
            scenarioData: "./client/pages/scenarioData/scenarioDataPage.ts",
            mods: "./client/pages/mods/modsPage.ts",
            account: "./client/pages/account/accountPage.ts"
        };
    }

    return {
        entry,
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
                                publicPath: '/'
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
            new webpack.ProvidePlugin({
                Buffer: 'buffer',
                util: 'util',
                process: 'process/browser',
            })
        ],
        optimization: {
            minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
        },
        stats: 'errors-only',
        devtool: isDev ? "source-map" : undefined
    }
};