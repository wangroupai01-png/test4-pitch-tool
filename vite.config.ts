import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Melody Challenger - 音高大师',
        short_name: '音高大师',
        description: '游戏化音乐耳朵训练平台',
        theme_color: '#7F5AF0',
        background_color: '#FFFFFE',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        // 缓存策略
        runtimeCaching: [
          {
            // 缓存静态资源（JS、CSS、图片）
            urlPattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
              }
            }
          },
          {
            // 缓存音频文件（soundfont）- 关键！
            urlPattern: /cdn\.jsdelivr\.net.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-samples',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 24 * 60 * 60 // 60天
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Supabase API - 网络优先，离线时使用缓存
            urlPattern: /supabase\.co/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5分钟
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 页面导航 - 网络优先
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 24 * 60 * 60 // 1天
              }
            }
          }
        ],
        // 预缓存
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
