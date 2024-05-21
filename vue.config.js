const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})
// vue.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Backend server address
        changeOrigin: true,
        pathRewrite: { '^/api': '' }, // Remove /api prefix when forwarding to backend
      },
    },
  },
};

