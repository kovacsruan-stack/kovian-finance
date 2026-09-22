import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8082'
  return {
    base: '/app/',
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      proxy: { '/api': { target: apiProxyTarget, changeOrigin: true } },
    },
    preview: { host: '127.0.0.1', port: 4174, strictPort: true },
    build: {
      outDir: '../src/main/resources/static/app',
      emptyOutDir: false,
    },
  }
})
