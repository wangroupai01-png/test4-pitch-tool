import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 字符串简写写法：http://localhost:5173/foo -> http://localhost:4567/foo
      // '/foo': 'http://localhost:4567',

      // 选项写法
      '/api': {
        target: 'http://jsonplaceholder.typicode.com', // 目标服务器地址，请替换为你实际的后端地址
        changeOrigin: true, // 支持跨域
        rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径：去掉路径前的 /api
      },
    },
  },
})
