import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Manual chunking strategy to optimize the main bundle size
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group Firebase related packages into one chunk
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Group Chart.js into its own chunk (heavy dependency)
            if (id.includes('chart.js')) {
              return 'vendor-charts';
            }
            // Group Lucide icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Group React and related core libraries
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'vendor-react';
            }
            // Fallback for other node_modules
            return 'vendor-others';
          }
        },
      },
    },
    // Increase the limit slightly for the chunks themselves if needed
    chunkSizeWarningLimit: 600,
  },
});