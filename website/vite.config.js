import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true,
    middlewareMode: false,
    proxy: {},
    fs: {
      allow: ['.']
    }
  },
  // Add custom middleware for routing
  plugins: [
    {
      name: 'custom-routes',
      configureServer(server) {
        server.middlewares.use('/payments', (req, res, next) => {
          req.url = '/payments.html';
          next();
        });
      }
    }
  ]
}) 