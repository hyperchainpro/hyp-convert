const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    events: require.resolve('events'),
    process: require.resolve('process/browser'),
    path: require.resolve('path-browserify'),
    util: require.resolve('util'),
    fs: require.resolve('./lib/fs-polyfill.js'),
};

// Force jsPDF to use its browser ES module bundle instead of
// the node bundle (which uses AMD require that Metro can't handle).
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'jspdf') {
        // Redirect to the ES module (browser) bundle
        const browserBundle = path.resolve(
            __dirname,
            'node_modules',
            'jspdf',
            'dist',
            'jspdf.es.min.js'
        );
        return {
            filePath: browserBundle,
            type: 'sourceFile',
        };
    }
    // Fallback to default resolver
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
