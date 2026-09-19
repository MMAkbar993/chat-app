import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import staticPageMeta from './vite-plugins/staticPageMeta.js'
import { SITE_URL, HOW_IT_WORKS_META } from './src/pages/howItWorksMeta.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    staticPageMeta({ siteUrl: SITE_URL, pages: [HOW_IT_WORKS_META] }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
})
