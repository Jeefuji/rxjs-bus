const wpConf = require('./webpack.config')

// Webpack customization
var webpack = wpConf;
webpack.devtool = 'inline-source-map'
webpack.module.rules = webpack.module.rules.concat([
    // instrument only testing sources with Istanbul
    {
        test: /\.js$|\.jsx$/,
        use: {
            loader: 'istanbul-instrumenter-loader',
            options: { esModules: true }
        },
        enforce: 'post',
        exclude: /node_modules|\.test\.js$/
    }
])

module.exports = config => {
    config.set({
        browsers: ['Nightmare'],
        files: [
            '../test/**/*.test.js'
        ],
        frameworks: ['mocha', 'sinon-chai', 'sinon', 'chai-subset', 'chai'],
        plugins: [
            'karma-coverage-istanbul-reporter',
            'karma-phantomjs-launcher',
            'karma-mocha',
            'karma-chai',
            'karma-chai-subset',
            'karma-chrome-launcher',
            'karma-mocha-reporter',
            'karma-nightmare',
            'karma-sinon',
            'karma-sinon-chai',
            'karma-sourcemap-loader',
            'karma-webpack'
        ],
        preprocessors: {
            '../test/**/*.test.js': ['webpack', 'sourcemap']
        },
        reporters: ['mocha', 'coverage-istanbul'],
        singleRun: true,
        client: {
            captureConsole: false
        },
        webpack: webpack,
        webpackMiddleware: {
            // noInfo: true
        },
        coverageIstanbulReporter: {
            dir: './bin/coverage/',
            reports: [ 'text-summary', 'html' ],
            fixWebpackSourcePaths: true
        }
    })
}
