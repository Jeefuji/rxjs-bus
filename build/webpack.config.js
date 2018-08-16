const path = require('path')
const webpack = require('webpack')

const CompressionPlugin = require('compression-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'
const isAnalyze = process.env.NODE_ENV === 'analyze'

const bundleOutputDir = './dist'
const projectRoot = path.resolve(path.join(__dirname, '..'))

console.info(`Project Root: ${projectRoot}`)

function resolve (dir) {
    return path.resolve(path.join(__dirname, '..'), dir)
}

var config = {
    mode: isDev ? "development" : "production", 
    devtool: isProd ? 'source-map' : false,
    target: "web",
    context: projectRoot,
    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': resolve('src'),
        }
    },
    entry: {
        "rxjs-bus": resolve('src/index.js')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: [resolve('src')],
                exclude: /test\.js/
            }
        ]
    },   
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                parallel: 4,
                sourceMap: true,
                uglifyOptions: {
                    ecma: 8,
                    compress: true,
                    mangle: true
                }
            })
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(isDev ? 'development' : 'production')
            }
        })

    ],
    output: {
        path: resolve(bundleOutputDir),
        library: 'rxjs-bus',
        libraryTarget: 'umd',
        filename: '[name].js',
        publicPath: '/dist/'
    }
}

if (isDev) {
    config.plugins = config.plugins.concat([
        // Plugins that apply in development builds only
        new webpack.SourceMapDevToolPlugin({
            filename: '[file].map', // Remove this line if you prefer inline source maps
            moduleFilenameTemplate: path.relative(resolve(bundleOutputDir), '[resourcePath]') // Point sourcemap entries to the original file locations on disk
        })
    ])
}

if (isProd || isAnalyze) {
    config.plugins = config.plugins.concat([
        // Plugins that apply in production builds only
        /*new CleanWebpackPlugin([resolve(bundleOutputDir)], {
            root: projectRoot
        }),*/
        new CompressionPlugin({
            asset: '[path].gz[query]',
            algorithm: 'gzip',
            test: /\.(js|html)$/,
            threshold: 10240,
            minRatio: 0.8
        })
    ])
}

if (isAnalyze) {
    config.plugins = config.plugins.concat([
        new BundleAnalyzerPlugin({
            analyzerMode: 'static'
        })
    ])
}

var nodeConfig = Object.assign({}, config);
nodeConfig.target = "node";
nodeConfig.output = Object.assign({}, config.output);
nodeConfig.output.filename = "[name].node.js";

module.exports = [config, nodeConfig]
