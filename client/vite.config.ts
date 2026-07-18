import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.SERVER_PORT || 3000}`,
        changeOrigin: true,
      },
      '/api/devices/': {
        target: `ws://localhost:${process.env.SERVER_PORT || 3000}`,
        ws: true,
      },
    },
  },
})
