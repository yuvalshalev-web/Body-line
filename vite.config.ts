import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // הוספת הגדרות Build כדי למנוע את שגיאת ה-tsx
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: false,
  },
  // מבטיח שהנתיבים יהיו יחסיים ולא ישברו ב-Cloud Run
  base: '/', 
});