import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // עדכון ה-base לשם הרפוזיטורי שלך כדי שהנכסים ייטענו נכון ב-Production
  base: '/',
  plugins: [
    react(), 
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: false,
  },
  define: {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true
  }
})