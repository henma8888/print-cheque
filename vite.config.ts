import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/print-cheque/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '開支票',
        short_name: '開支票',
        description: '簡潔開支票：日期、抬頭、銀碼對位列印',
        lang: 'zh-HK',
        start_url: '/print-cheque/',
        scope: '/print-cheque/',
        display: 'standalone',
        background_color: '#f4f0e8',
        theme_color: '#1c4d3e',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
