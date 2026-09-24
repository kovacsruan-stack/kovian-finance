import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8082'
  const appBasePath = process.env.VERCEL ? '/' : env.VITE_APP_BASE_PATH || '/app/'
  return {
    base: appBasePath.endsWith('/') ? appBasePath : `${appBasePath}/`,
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5174,
      strictPort: true,
      proxy: { '/api': { target: apiProxyTarget, changeOrigin: true } },
    },
    preview: { host: '0.0.0.0', port: 4174, strictPort: true },
    build: {
      outDir: process.env.VERCEL ? 'dist' : '../src/main/resources/static/app',
      emptyOutDir: false,
    },
  }
})