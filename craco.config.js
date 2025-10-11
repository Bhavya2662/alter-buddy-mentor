const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@tldraw/state': path.resolve(__dirname, 'node_modules/@tldraw/state'),
      '@tldraw/editor': path.resolve(__dirname, 'node_modules/@tldraw/editor'),
      '@tldraw/store': path.resolve(__dirname, 'node_modules/@tldraw/store'),
      '@tldraw/tldraw': path.resolve(__dirname, 'node_modules/@tldraw/tldraw'),
      '@tldraw/tlschema': path.resolve(__dirname, 'node_modules/@tldraw/tlschema'),
      '@tldraw/utils': path.resolve(__dirname, 'node_modules/@tldraw/utils'),
      '@tldraw/validate': path.resolve(__dirname, 'node_modules/@tldraw/validate')
    }
  }
};